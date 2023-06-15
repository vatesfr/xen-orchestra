'use strict'

const { extractOpaqueRef } = require('@xen-orchestra/xapi')

const { Task } = require('../../Task')
const assert = require('node:assert/strict')
const { HealthCheckVmBackup } = require('../../HealthCheckVmBackup')
const { Ref } = require('xen-api')

exports.MixinXapiWriter = (BaseClass = Object) =>
  class MixinXapiWriter extends BaseClass {
    constructor({ sr, ...rest }) {
      super(rest)

      this._sr = sr
    }

    // check if the base Vm has all its disk on health check sr
    async #isAlreadyOnHealthCheckSr(baseVm) {
      const xapi = baseVm.$xapi
      let onSameSr = true
      for (const vbdRef of baseVm.VBDs) {
        const vbd = await xapi.getRecord('VBD', vbdRef)
        if (vbd.type === 'Disk' && Ref.isNotEmpty(vbd.VDI)) {
          const vdi = await xapi.getRecord('VDI', vbd.VDI)
          onSameSr = onSameSr && vdi.$SR.uuid === this._healthCheckSr.uuid
        }
      }
      return onSameSr
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
          let clonedVm
          try {
            const baseVm = xapi.getObject(this._targetVmRef) ?? (await xapi.waitObject(this._targetVmRef))
            let clonedRef

            if (await this.#isAlreadyOnHealthCheckSr(baseVm)) {
              Task.info('Use a clone rather than a copy for health check')
              clonedRef = await xapi
                .callAsync('VM.clone', this._targetVmRef, `Health Check - ${baseVm.name_label}`)
                .then(extractOpaqueRef)
            } else {
              clonedRef = await xapi
                .callAsync(
                  'VM.copy',
                  this._targetVmRef,
                  `Health Check - ${baseVm.name_label}`,
                  this._healthCheckSr.uuid
                )
                .then(extractOpaqueRef)
            }
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
