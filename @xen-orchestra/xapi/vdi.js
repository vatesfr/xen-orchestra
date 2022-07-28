'use strict'

const assert = require('node:assert').strict
const CancelToken = require('promise-toolbox/CancelToken')
const pCatch = require('promise-toolbox/catch')
const pRetry = require('promise-toolbox/retry')
const { decorateClass } = require('@vates/decorate-with')

const extractOpaqueRef = require('./_extractOpaqueRef.js')

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

  async exportContent(ref, { baseRef, cancelToken = CancelToken.none, format }) {
    const query = {
      format,
      vdi: ref,
    }
    if (baseRef !== undefined) {
      query.base = baseRef
    }
    try {
      return await this.getResource(cancelToken, '/export_raw_vdi/', {
        query,
        task: await this.task_create(`Exporting content of VDI ${await this.getField('VDI', ref, 'name_label')}`),
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
