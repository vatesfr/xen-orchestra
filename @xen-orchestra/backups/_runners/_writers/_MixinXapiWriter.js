'use strict'

const { extractOpaqueRef } = require('@xen-orchestra/xapi')

const { Task } = require('../../Task')
const assert = require('node:assert/strict')
const { HealthCheckVmBackup } = require('../../HealthCheckVmBackup')

exports.MixinXapiWriter = (BaseClass = Object) =>
  class MixinXapiWriter extends BaseClass {
    constructor({ sr, ...rest }) {
      super(rest)

      this._sr = sr
    }

    healthCheck() {
      const sr = this._settings.healthCheckSr
      assert.notStrictEqual(sr, undefined, 'SR should be defined before making a health check')
      assert.notEqual(this._targetVmRef, undefined, 'A vm should have been transfered to be health checked')
      // copy VM
      return Task.run(
        {
          name: 'health check',
        },
        async () => {
          const { $xapi: xapi } = sr
          let clonedVm
          try {
            const baseVm = xapi.getObject(this._targetVmRef) ?? (await xapi.waitObject(this._targetVmRef))
            const clonedRef = await xapi
              .callAsync('VM.clone', this._targetVmRef, `Health Check - ${baseVm.name_label}`)
              .then(extractOpaqueRef)
            clonedVm = xapi.getObject(clonedRef) ?? (await xapi.waitObject(clonedRef))

            await new HealthCheckVmBackup({
              restoredVm: clonedVm,
              xapi,
            }).run()
          } finally {
            clonedVm && (await xapi.VM_destroy(clonedVm.$ref))
          }
        }
      )
    }
  }
