import CancelToken from 'promise-toolbox/CancelToken'
import pCatch from 'promise-toolbox/catch'
import pRetry from 'promise-toolbox/retry'
import { createLogger } from '@xen-orchestra/log'
import { decorateClass } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { readChunk } from '@vates/read-chunk'
import { strict as assert } from 'node:assert'

import { SUPPORTED_VDI_FORMAT, VDI_FORMAT_RAW } from './index.mjs'

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
    const body = (await readChunk(stream, 1024)).toString('utf8')
    warn('invalid HTTP header in response body', { body })
    Object.defineProperty(error, 'response', { body })
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

  /**
   * return a buffer with 0/1 bit, showing if the 64KB block corresponding
   * in the raw vdi has changed
   */
  async listChangedBlock(ref, baseRef) {
    const encoded = await this.callAsync('VDI.list_changed_blocks', baseRef, ref)
    return Buffer.from(encoded, 'base64')
  }

  /**
   * will disable CBT on the VDI, all its ancestor and will purge
   * snapshots of type cbt_metadata of this chain
   *
   * @param {OpaqueRef} vdiRef
   */
  async disableCbtOnChain(vdiRef) {
    const smConfig = await this.getField('VDI', vdiRef, 'sm_config')
    if (smConfig['vhd-parent']) {
      const parentRef = await this.call('VDI.get_by_uuid', smConfig['vhd-parent'])
      await this.VDI_disableCbtOnChain(parentRef)
    }
    const snapshotRefs = await this.getField('VDI', vdiRef, 'snapshots')
    for (const snapshotRef of snapshotRefs) {
      const type = await this.getField('VDI', snapshotRef, 'type')
      if (type === 'cbt_metadata') {
        try {
          await this.VDI_destroy(snapshotRef)
        } catch (err) {
          warn('couldn t destroy snapshot', { err, vdiRef, snapshotRef })
        }
      }
      /**
       * xapi can't disable CBT on a snapshot OPERATION_NOT_ALLOWED(VDI is a snapshot)
       */
    }
    try {
      await this.callAsync('VDI.disable_cbt', vdiRef)
    } catch (err) {
      warn('couldn t disable cbt on disk', { err, vdiRef })
    }
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

  async exportContent($defer, ref, { baseRef, cancelToken = CancelToken.none, format }) {
    const query = {
      format,
      vdi: ref,
    }

    // now we'll handle the VHD and qcow2 export
    if (!SUPPORTED_VDI_FORMAT.includes(format)) {
      throw new Error(`${format} is not in the allowed export format ${JSON.stringify(SUPPORTED_VDI_FORMAT)}`)
    }
    $defer.onFailure(() => this.VDI_disconnectFromControlDomain(ref))

    const label = await this.getField('VDI', ref, 'name_label')
    if (format === VDI_FORMAT_RAW) {
      // RAW export do not use NBD to simplify code
      assert.equal(baseRef, undefined)
      const { body } = await this.getResource(cancelToken, '/export_raw_vdi/', {
        query,
        task: await this.task_create(`Exporting content of VDI as raw stream`),
      })

      await checkVdiExport(body)

      return body
    }

    if (baseRef !== undefined) {
      query.base = baseRef
    }
    const stream = (
      await this.getResource(cancelToken, '/export_raw_vdi/', {
        query,
        task: await this.task_create(`Exporting content of VDI  ${label} as VHD stream`),
      })
    ).body

    $defer.onFailure(() => {
      stream.on('error', noop).destroy()
    })

    await checkVdiExport(stream)

    return stream
  }

  /**
   *
   * @param {string} vdiRef
   * @param {string | undefined} baseRef
   * @returns
   */

  async importContent(ref, stream, { cancelToken = CancelToken.none, format }) {
    assert.notEqual(format, undefined)
    // now we'll handle the VHD and qcow2 export
    if (!SUPPORTED_VDI_FORMAT.includes(format)) {
      throw new Error(`${format} is not in the allowed import format ${JSON.stringify(SUPPORTED_VDI_FORMAT)}`)
    }
    if (stream.length === undefined) {
      throw new Error(
        'Trying to import a VDI without a length field. Please report this error to the Xen Orchestra team.'
      )
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
