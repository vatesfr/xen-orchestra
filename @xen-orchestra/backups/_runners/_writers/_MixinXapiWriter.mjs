import assert from 'node:assert/strict'
import { Task } from '@vates/task'

import { HealthCheckVmBackup } from '../../HealthCheckVmBackup.mjs'
import ms from 'ms'

export const MixinXapiWriter = (BaseClass = Object) =>
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
        if (vdi.$SR.uuid !== this._healthCheckSr.uuid) {
          return false
        }
      }
      return true
    }

    healthCheck() {
      // the SR that the VM has been replicated on
      const sr = this._sr
      assert.notStrictEqual(sr, undefined, 'SR should be defined before making a health check')
      assert.notEqual(this._targetVmRef, undefined, 'A vm should have been transfered to be health checked')
      // copy VM
      return Task.run(
        {
          properties: { name: 'health check' },
        },
        async () => {
          const { $xapi: xapi } = sr
          let healthCheckVmRef
          try {
            let baseVm
            try {
              baseVm = xapi.getObject(this._targetVmRef)
            } catch (err) {
              baseVm = await xapi.waitObject(this._targetVmRef)
            }
            if (await this.#isAlreadyOnHealthCheckSr(baseVm)) {
              healthCheckVmRef = await Task.run(
                { properties: { name: 'cloning-vm' } },
                async () => await xapi.callAsync('VM.clone', this._targetVmRef, `Health Check - ${baseVm.name_label}`)
              )
            } else {
              healthCheckVmRef = await Task.run(
                { properties: { name: 'copying-vm' } },
                async () =>
                  await xapi.callAsync(
                    'VM.copy',
                    this._targetVmRef,
                    `Health Check - ${baseVm.name_label}`,
                    this._healthCheckSr.$ref
                  )
              )
            }
            const healthCheckVm =
              xapi.getObject(healthCheckVmRef, undefined) ?? (await xapi.waitObject(healthCheckVmRef))
            await healthCheckVm.add_tags('xo:no-bak=Health Check')
            const timeout = ms(this._settings.healthCheckTimeout)
            await new HealthCheckVmBackup({
              restoredVm: healthCheckVm,
              timeout,
              xapi,
            }).run()
          } finally {
            healthCheckVmRef && (await xapi.VM_destroy(healthCheckVmRef))
          }
        }
      )
    }
  }
