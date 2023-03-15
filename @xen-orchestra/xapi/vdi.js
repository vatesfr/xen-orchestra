'use strict'

const assert = require('node:assert').strict
const CancelToken = require('promise-toolbox/CancelToken')
const pCatch = require('promise-toolbox/catch')
const pRetry = require('promise-toolbox/retry')
const { decorateClass } = require('@vates/decorate-with')

const extractOpaqueRef = require('./_extractOpaqueRef.js')
const NbdClient = require('@vates/nbd-client')
const { createNbdRawStream, createNbdVhdStream } = require('vhd-lib/createStreamNbd.js')

const noop = Function.prototype

class Vdi {
  async clone(vdiRef) {
    return extractOpaqueRef(await this.callAsync('VDI.clone', vdiRef))
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

  async exportContent(ref, { baseRef, cancelToken = CancelToken.none, format, preferNbd = true }) {
    const query = {
      format,
      vdi: ref,
    }
    if (baseRef !== undefined) {
      // delta is not compatible with raw export
      assert.equal(format, 'vhd')

      query.base = baseRef
    }
    let nbdClient
    try {
      if (preferNbd) {
        const nbdInfos = await this.call('VDI.get_nbd_info', ref)
        if (nbdInfos.length > 0) {
          // a little bit of randomization to spread the load
          const nbdInfo = nbdInfos[Math.floor(Math.random() * nbdInfos.length)]
          try {
            nbdClient = new NbdClient(nbdInfo)
            await nbdClient.connect()
          } catch (err) {
            console.error({
              err,
              nbdInfo,
            })
            nbdClient = undefined
          }
        }
      }
      // the raw nbd export does not need to peek ath the vhd source
      if (nbdClient !== undefined && format === 'raw') {
        return createNbdRawStream(nbdClient)
      }
      const restourceStream = await this.getResource(cancelToken, '/export_raw_vdi/', {
        query,
        task: await this.task_create(`Exporting content of VDI ${await this.getField('VDI', ref, 'name_label')}`),
      })
      if (nbdClient !== undefined && format === 'vhd') {
        const stream = await createNbdVhdStream(nbdClient, restourceStream)
        stream.on('error', () => nbdClient.disconnect())
        stream.on('end', () => nbdClient.disconnect())
        return stream
      }
      // no nbd : use the direct export
      return restourceStream
    } catch (error) {
      // augment the error with as much relevant info as possible
      const [poolMaster, vdi] = await Promise.all([
        this.getRecord('host', this.pool.master),
        this.getRecord('VDI', ref),
      ])
      error.pool_master = poolMaster
      error.SR = await this.getRecord('SR', vdi.SR)
      error.VDI = vdi
      error.nbdClient = nbdClient
      nbdClient?.disconnect()
      throw error
    }
  }

  async importContent(ref, stream, { cancelToken = CancelToken.none, format }) {
    assert.notEqual(format, undefined)

    if (stream.length === undefined) {
      throw new Error('Trying to import a VDI without a length field. Please report this error to Xen Orchestra.')
    }
    try {
      await this.putResource(cancelToken, stream, '/import_raw_vdi/', {
        query: {
          format,
          vdi: ref,
        },
        task: await this.task_create(`Importing content into VDI ${await this.getField('VDI', ref, 'name_label')}`),
      })
    } catch (error) {
      // augment the error with as much relevant info as possible
      const [poolMaster, vdi] = await Promise.all([
        this.getRecord('host', this.pool.master),
        this.getRecord('VDI', ref),
      ])
      error.pool_master = poolMaster
      error.SR = await this.getRecord('SR', vdi.SR)
      error.VDI = vdi
      throw error
    }
  }
}
module.exports = Vdi

decorateClass(Vdi, {
  // work around a race condition in XCP-ng/XenServer where the disk is not fully unmounted yet
  destroy: [
    pRetry.wrap,
    function () {
      return this._vdiDestroyRetryWhenInUse
    },
  ],
})
