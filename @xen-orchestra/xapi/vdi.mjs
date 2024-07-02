import CancelToken from 'promise-toolbox/CancelToken'
import pCatch from 'promise-toolbox/catch'
import pRetry from 'promise-toolbox/retry'
import { createLogger } from '@xen-orchestra/log'
import { decorateClass } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { strict as assert } from 'node:assert'

import MultiNbdClient from '@vates/nbd-client/multi.mjs'
import { createNbdVhdStream } from 'vhd-lib/createStreamNbd.js'
import { VDI_FORMAT_RAW, VDI_FORMAT_VHD } from './index.mjs'
import { finished } from 'node:stream'
import { pTimeout } from 'promise-toolbox'

const { warn, info } = createLogger('xo:xapi:vdi')

const noop = Function.prototype

const DESTROY_STREAM_TIMEOUT = 1e4

const destroyUnidiciStreamSilently = function (stream) {
  if (stream === undefined || stream.destroyed) {
    return
  }
  return pTimeout.call(
    new Promise((resolve, reject) => {
      stream.on('error', err => {
        // this error code is directly caused by stream.destroy
        if (err.code === 'UND_ERR_ABORTED') {
          resolve()
        } else {
          reject(err)
        }
      })
      stream.destroy()
    }),
    DESTROY_STREAM_TIMEOUT
  )
}

class Vdi {
  async clone(vdiRef) {
    return await this.callAsync('VDI.clone', vdiRef)
  }

  async destroy(vdiRef) {
    await pCatch.call(
      this.callAsync('VDI.destroy', vdiRef),
      // if this VDI is not found, consider it destroyed
      { code: 'HANDLE_INVALID' },
      noop
    )
  }

  async create(
    {
      name_description,
      name_label,
      other_config = {},
      read_only = false,
      sharable = false,
      SR = this.pool.default_SR,
      tags,
      type = 'user',
      virtual_size,
      xenstore_data,
    },
    {
      // blindly copying `sm_config` from another VDI can create problems,
      // therefore it should be passed explicitly
      //
      // see https://github.com/vatesfr/xen-orchestra/issues/4482
      sm_config,
    } = {}
  ) {
    return this.call('VDI.create', {
      name_description,
      name_label,
      other_config,
      read_only,
      sharable,
      sm_config,
      SR,
      tags,
      type,
      virtual_size,
      xenstore_data,
    })
  }

  async _getNbdClient(ref, { nbdConcurrency = 1 } = {}) {
    const nbdInfos = await this.call('VDI.get_nbd_info', ref)
    if (nbdInfos.length > 0) {
      // a little bit of randomization to spread the load
      const nbdInfo = nbdInfos[Math.floor(Math.random() * nbdInfos.length)]
      try {
        const nbdClient = new MultiNbdClient(nbdInfos, { ...this._nbdOptions, nbdConcurrency })
        await nbdClient.connect()
        return nbdClient
      } catch (err) {
        warn(`can't connect to nbd server `, {
          err,
          nbdInfo,
          nbdInfos,
        })
      }
    }
  }

  // return an buffer with 0/1 bit, showing if the 64KB block corresponding
  // in the raw vdi has changed
  async listChangedBlock(ref, baseRef) {
    const encoded = await this.call('VDI.list_changed_blocks', baseRef, ref)
    const buf = Buffer.from(encoded, 'base64')
    return buf
  }

  async dataDestroy(ref) {
    return this.call('VDI.data_destroy', ref)
  }

  async disconnectFromControlDomain(vdiRef) {
    const vbdRefs = await this.getField('VDI', vdiRef, 'VBDs')
    const self = this
    await Promise.all(
      vbdRefs.map(async vbdRef => {
        const vmRef = await this.getField('VBD', vbdRef, 'VM')
        const isControlDomain = await this.getField('VM', vmRef, 'is_control_domain')
        if (isControlDomain) {
          try {
            await pRetry(() => self.VBD_destroy(vbdRef), {
              async onRetry(error) {
                warn('disconnectFromControlDomain retry', { attemptNumber: this.attemptNumber, error })
              },
            })
            info(` ${vdiRef} has been disconnected from dom0`, { vdiRef, vbdRef })
          } catch (err) {
            warn(`Couldn't disconnect ${vdiRef} from dom0`, { vdiRef, vbdRef })
          }
        }
      })
    )
  }

  async exportContent(
    $defer,
    ref,
    { baseRef, cancelToken = CancelToken.none, format, nbdConcurrency = 1, preferNbd = this._preferNbd }
  ) {
    const query = {
      format,
      vdi: ref,
    }

    const [cbt_enabled, size, uuid, vdiName] = await Promise.all([
      this.getField('VDI', ref, 'cbt_enabled'),
      this.getField('VDI', ref, 'virtual_size'),
      this.getField('VDI', ref, 'uuid'),
      this.getField('VDI', ref, 'name_label'),
    ])

    $defer.onFailure(() => this.VDI_disconnectFromControlDomain(ref))

    if (format === VDI_FORMAT_RAW) {
      // RAW export do not use NBD to simplify code
      assert.equal(baseRef, undefined)
      return this.getResource(cancelToken, '/export_raw_vdi/', {
        query,
        task: await this.task_create(`Exporting content of VDI ${vdiName}`),
      })
    }

    // now we'll handle the VHD
    assert.equal(format, VDI_FORMAT_VHD)
    if (baseRef !== undefined) {
      query.base = baseRef
    }

    let nbdClient, // optional : the nbd client used to transfer this vdi
      exportStream, // the stream read from the XAPI
      stream, // the stream that will be returned (exportStream or using NBD)
      taskRef, // the reference to the export stream (if created manually)
      changedBlocks, // the CBT list of blocks
      baseParentUuid // the uuid of the parent used as a base for a delta export

    if (baseRef !== undefined && preferNbd && cbt_enabled) {
      // use CBT if possible
      // call to list changed blocks must be done before the vdi is mounted for NBD export
      try {
        changedBlocks = await this.VDI_listChangedBlock(ref, baseRef)
        baseParentUuid = await this.getField('VDI', baseRef, 'sm_config').then(sm_config => sm_config?.['vhd-parent'])

        info('found changed blocks and base parent uuid ', { changedBlocks, baseParentUuid })
      } catch (error) {
        // do not fail if CBT is not enabled/working
        info(`can't get changed block nor parent uuid`, { error, ref, baseRef })
      }
    }

    // really connect to NBD server
    if (preferNbd) {
      nbdClient = await this._getNbdClient(ref, { nbdConcurrency })
      // disconnect on failure or when transfer is finished
      $defer.onFailure(() => nbdClient?.disconnect())
    }

    // create a xapi export stream only if we won't make a delta from CBT
    // a CBT export can only work if we have a NBD client and changed blocks
    if (changedBlocks === undefined || nbdClient === undefined) {
      stream = exportStream = (
        await this.getResource(cancelToken, '/export_raw_vdi/', {
          query,
          task: await this.task_create(`Exporting content of VDI ${vdiName}`),
        })
      ).body

      $defer.onFailure(() => {
        destroyUnidiciStreamSilently(exportStream)
      })
    }

    // we have a NBD client : use it to transfer download data
    // use either the changed block or exportStream to compute the header/footer/BAT
    if (nbdClient !== undefined) {
      taskRef = await this.task_create(
        `Exporting content of VDI ${vdiName} using NBD ${changedBlocks !== undefined ? ' and CBT' : ''}`
      )
      $defer.onFailure(() => this.task_destroy(taskRef).catch(warn))
      // stream is now using CBT, exportStream still keep a ref to the XAPI export stream
      stream = await createNbdVhdStream(nbdClient, exportStream, {
        changedBlocks,
        vdiInfos: { size, uuid, parentUuid: baseParentUuid },
        onProgress: progress => {
          this.call('task.set_progress', taskRef, progress).catch(warn)
        },
      })
      // we don't need the export stream anymore, block data will be read through NBD
      await destroyUnidiciStreamSilently(exportStream)
    }

    assert.notStrictEqual(stream, undefined)

    // disconnect and clean everything when stream is completly transmitted
    finished(stream, async () => {
      await nbdClient?.disconnect()
      if (taskRef !== undefined) {
        this.task_destroy(taskRef).catch(warn)
      }
      await this.VDI_disconnectFromControlDomain(ref).catch(warn)
    })
    return stream
  }

  async importContent(ref, stream, { cancelToken = CancelToken.none, format }) {
    assert.notEqual(format, undefined)

    if (stream.length === undefined) {
      throw new Error('Trying to import a VDI without a length field. Please report this error to Xen Orchestra.')
    }

    const vdi = await this.getRecord('VDI', ref)
    const sr = await this.getRecord('SR', vdi.SR)
    try {
      const taskRef = await this.task_create(`Importing content into VDI ${vdi.name_label} on SR ${sr.name_label}`)
      const uuid = await this.getField('task', taskRef, 'uuid')
      await vdi.update_other_config({ 'xo:import:task': uuid, 'xo:import:length': stream.length.toString() })
      await this.putResource(cancelToken, stream, '/import_raw_vdi/', {
        query: {
          format,
          vdi: ref,
        },
        task: taskRef,
      })
    } catch (error) {
      // augment the error with as much relevant info as possible
      const poolMaster = await this.getRecord('host', this.pool.master)
      error.pool_master = poolMaster
      error.SR = sr
      error.VDI = vdi
      throw error
    } finally {
      vdi.update_other_config({ 'xo:import:task': null, 'xo:import:length': null }).catch(warn)
    }
  }
}
export default Vdi

decorateClass(Vdi, {
  // work around a race condition in XCP-ng/XenServer where the disk is not fully unmounted yet
  destroy: [
    pRetry.wrap,
    function () {
      return this._vdiDestroyRetryWhenInUse
    },
  ],
  exportContent: defer,
})
