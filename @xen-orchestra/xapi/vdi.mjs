import CancelToken from 'promise-toolbox/CancelToken'
import pCatch from 'promise-toolbox/catch'
import pRetry from 'promise-toolbox/retry'
import { createLogger } from '@xen-orchestra/log'
import { createVhdStreamWithLength } from 'vhd-lib'
import { decorateClass } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { readChunk } from '@vates/read-chunk'
import { strict as assert } from 'node:assert'

import MultiNbdClient from '@vates/nbd-client/multi.mjs'
import { createNbdVhdStream } from 'vhd-lib/createStreamNbd.js'
import { VDI_FORMAT_RAW, VDI_FORMAT_VHD } from './index.mjs'
import { finished } from 'node:stream'

const { warn, info } = createLogger('xo:xapi:vdi')

// 2024-09-26 - Work-around a XAPI bug: sometimes the response status is
// `200 OK` but the body contains a full HTTP response
//
// Example:
//
// ```http
// HTTP/1.1 500 Internal Error
// content-length: 357
// content-type:text/html
// connection:close
// cache-control:no-cache, no-store
//
// <html><body><h1>HTTP 500 internal server error</h1>An unexpected error occurred; please wait a while and try again. If the problem persists, please contact your support representative.<h1> Additional information </h1>SR_BACKEND_FAILURE_46: [ ; The VDI is not available [opterr=VDI d63513c8-b662-41cd-a355-a63efb5f073f not detached cleanly];  ]</body></html>
// ```
//
// Related GitHub issue: https://github.com/xapi-project/xen-api/issues/4603
//
// This function detects this and throw an error
async function checkVdiExport(stream) {
  const chunk = await readChunk(stream, 5)
  stream.unshift(chunk)
  if (String(chunk) === 'HTTP/') {
    const error = new Error('invalid HTTP header in response body')
    Object.defineProperty(error, 'response', { body: await readChunk(stream, 1024) })
    throw error
  }
}

const noop = Function.prototype
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

  async destroyCloudInitConfig(vdiRef, { timeLimit = Date.now() + 10 * 60 * 1000 } = {}) {
    const vbdRef = (await this.getField('VDI', vdiRef, 'VBDs'))[0]
    const vmRef = await this.getField('VBD', vbdRef, 'VM')

    await this.waitObjectState(vmRef, vm => vm.power_state === 'Running', {
      timeout: timeLimit - Date.now(),
    })

    const vm = await this.getRecord('VM', vmRef)
    await this.waitObjectState(vm.guest_metrics, gm => gm?.PV_drivers_detected, {
      timeout: timeLimit - Date.now(),
    }).catch(error => {
      warn('failed to wait guest metrics, consider VM as started', {
        error,
        vm: { uuid: vm.uuid },
      })
    })

    // See https://github.com/vatesfr/xen-orchestra/issues/8219
    await new Promise(resolve => setTimeout(resolve, this._vdiDelayBeforeRemovingCloudConfigDrive))

    await this.VBD_unplug(vbdRef)
    await this.VDI_destroy(vdiRef)
  }

  async dataDestroy(vdiRef) {
    await this.callAsync('VDI.data_destroy', vdiRef)
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

  async _connectNbdClientIfPossible(ref, { nbdConcurrency = 1 } = {}) {
    let nbdInfos = await this.call('VDI.get_nbd_info', ref)
    if (nbdInfos.length > 0) {
      // filter nbd to only use backup network ( if set )
      const poolBackupNetwork = this._pool.other_config['xo:backupNetwork']
      if (poolBackupNetwork) {
        const networkRef = await this.call('network.get_by_uuid', poolBackupNetwork)
        const pifs = await this.getField('network', networkRef, 'PIFs')
        // @todo implement ipv6
        const adresses = await Promise.all(pifs.map(pifRef => this.getField('PIF', pifRef, 'IP')))
        nbdInfos = nbdInfos.filter(({ address }) => adresses.includes(address))
      }

      try {
        const nbdClient = new MultiNbdClient(nbdInfos, { ...this._nbdOptions, nbdConcurrency })
        await nbdClient.connect()
        return nbdClient
      } catch (err) {
        warn(`can't connect to nbd server `, {
          err,
          nbdInfos,
        })
      }
    }
  }

  /**
   * return an buffer with 0/1 bit, showing if the 64KB block corresponding
   * in the raw vdi has changed
   */
  async listChangedBlock(ref, baseRef) {
    const encoded = await this.callAsync('VDI.list_changed_blocks', baseRef, ref)
    return Buffer.from(encoded, 'base64')
  }

  async disconnectFromControlDomain(vdiRef) {
    let vbdRefs
    try {
      vbdRefs = await this.getField('VDI', vdiRef, 'VBDs')
    } catch (err) {
      // since we can't get the info of this record we assume it is delete or deleting
      // this can happen when multiple process compete for the resources
      // or if xapi is taking too much time to answer to a destroy/data_destroy
      if (err.code === 'HANDLE_INVALID') {
        return
      }
      throw err
    }
    await Promise.all(
      vbdRefs.map(async vbdRef => {
        const vmRef = await this.getField('VBD', vbdRef, 'VM')
        const isControlDomain = await this.getField('VM', vmRef, 'is_control_domain')
        if (isControlDomain) {
          try {
            await this.VBD_destroy(vbdRef)
            info(` ${vbdRef} has been disconnected from dom0`, { vdiRef, vbdRef })
          } catch (err) {
            if (err.code === 'HANDLE_INVALID') {
              info(` ${vbdRef} was already destroyed`, { vdiRef, vbdRef })
            } else {
              try {
                await this.getRecord('VBD', vbdRef)
                warn(`Couldn't disconnect ${vdiRef} from dom0`, { vdiRef, vbdRef, err })
              } catch (err2) {
                // since we can't get the info of this record we assume it is delete or deleting
              }
            }
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
      this.getField('VDI', ref, 'cbt_enabled').catch(() => {
        /* on XS < 7.3 cbt is not supported */
      }),
      this.getField('VDI', ref, 'virtual_size'),
      this.getField('VDI', ref, 'uuid'),
      this.getField('VDI', ref, 'name_label'),
    ])

    $defer.onFailure(() => this.VDI_disconnectFromControlDomain(ref))

    if (format === VDI_FORMAT_RAW) {
      // RAW export do not use NBD to simplify code
      assert.equal(baseRef, undefined)
      const { body } = await this.getResource(cancelToken, '/export_raw_vdi/', {
        query,
        task: await this.task_create(`Exporting content of VDI ${vdiName}`),
      })

      await checkVdiExport(body)

      return body
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
      baseParentUuid, // the uuid of the parent of the base for a delta export
      baseParentType // the vdiType of the parent, to heck if its a metadata backup or not

    if (baseRef !== undefined && preferNbd && cbt_enabled) {
      // use CBT if possible
      // call to list changed blocks must be done before the vdi is mounted for NBD export
      try {
        changedBlocks = await this.VDI_listChangedBlock(ref, baseRef)

        info('found changed blocks', { changedBlocks })
      } catch (error) {
        // do not fail if CBT is not enabled/working
        info(`can't get changed block`, { error, ref, baseRef })
        changedBlocks = undefined
      }

      // this may be undefined and is a nice to have
      // but backups and xapi don't trust nor use this value
      // will only be used with CBT
      baseParentUuid = await this.getField('VDI', baseRef, 'sm_config').then(sm_config => sm_config['vhd-parent'])
      baseParentType = await this.getField('VDI', baseRef, 'type')
    }

    // really connect to NBD server
    if (preferNbd) {
      nbdClient = await this._connectNbdClientIfPossible(ref, { nbdConcurrency })
      // disconnect on failure or when transfer is finished
      $defer.onFailure(() => nbdClient?.disconnect())
    }

    // create a xapi export stream only if we won't make a delta from CBT
    // a CBT export can only work if we have a NBD client and changed blocks
    if (changedBlocks === undefined || nbdClient === undefined) {
      if (baseParentType === 'cbt_metadata') {
        const e = new Error(`can't create a stream from a metadata VDI, fall back to a base `)
        e.code = 'VDI_CANT_DO_DELTA'
        throw e
      }

      stream = exportStream = (
        await this.getResource(cancelToken, '/export_raw_vdi/', {
          query,
          task: await this.task_create(`Exporting content of VDI ${vdiName}`),
        })
      ).body

      await checkVdiExport(stream)

      $defer.onFailure(() => {
        exportStream.on('error', noop).destroy()
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
      exportStream?.on('error', noop).destroy()
    }

    assert.notStrictEqual(stream, undefined)

    // disconnect and clean everything when stream is completly transmitted
    const self = this
    finished(stream, async function () {
      await nbdClient?.disconnect()
      if (taskRef !== undefined) {
        self.task_destroy(taskRef).catch(warn)
      }
      await self.VDI_disconnectFromControlDomain(ref).catch(warn)
    })
    return stream
  }

  async importContent(ref, stream, { cancelToken = CancelToken.none, format }) {
    assert.notEqual(format, undefined)

    if (stream.length === undefined) {
      if (format !== VDI_FORMAT_VHD) {
        throw new Error('Trying to import a VDI without a length field. Please report this error to Xen Orchestra.')
      }

      stream = await createVhdStreamWithLength(stream)
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
  // same condition when destroying data of a VDI
  dataDestroy: [
    pRetry.wrap,
    function () {
      return this._vdiDestroyRetryWhenInUse
    },
  ],
  exportContent: defer,
})
