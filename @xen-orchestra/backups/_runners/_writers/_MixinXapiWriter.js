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

    // check if the base Vm has all its disk on health check sr
    async #isAlreadyOnHealthCheckSr(baseVm) {
      const xapi = baseVm.$xapi
      const vdiRefs = await xapi.VM_getDisks(baseVm.$ref)
      for (const vdiRef of vdiRefs) {
        const vdi = xapi.getObject(vdiRef)
        if (vdi.$SR.uuid !== this._heathCheckSr.uuid) {
          return false
        }
      }
      return true
    }

    healthCheck() {
      const sr = this._healthCheckSr
      assert.notStrictEqual(sr, undefined, 'SR should be defined before making a health check')
      assert.notEqual(this._targetVmRef, undefined, 'A vm should have been transfered to be health checked')
      // copy VM
      return Task.run(
        {
          name: 'health check',
        },
        async () => {
          const { $xapi: xapi } = sr
          let healthCheckVmRef
          try {
            const baseVm = xapi.getObject(this._targetVmRef) ?? (await xapi.waitObject(this._targetVmRef))

            if (await this.#isAlreadyOnHealthCheckSr(baseVm)) {
              healthCheckVmRef = await Task.run(
                { name: 'cloning-vm' },
                async () =>
                  await xapi
                    .callAsync('VM.clone', this._targetVmRef, `Health Check - ${baseVm.name_label}`)
                    .then(extractOpaqueRef)
              )
            } else {
              healthCheckVmRef = await Task.run(
                { name: 'copying-vm' },
                async () =>
                  await xapi
                    .callAsync('VM.copy', this._targetVmRef, `Health Check - ${baseVm.name_label}`, sr.$ref)
                    .then(extractOpaqueRef)
              )
            }
            const healthCheckVm = xapi.getObject(healthCheckVmRef) ?? (await xapi.waitObject(healthCheckVmRef))

            await new HealthCheckVmBackup({
              restoredVm: healthCheckVm,
              xapi,
            }).run()
          } finally {
            healthCheckVmRef && (await xapi.VM_destroy(healthCheckVmRef))
          }
        }
      )
    }
  }
