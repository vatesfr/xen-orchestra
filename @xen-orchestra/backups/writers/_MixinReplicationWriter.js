'use strict'

const { Task } = require('../Task')
const assert = require('node:assert/strict')
const { HealthCheckVmBackup } = require('../HealthCheckVmBackup')

function extractOpaqueRef(str) {
  const OPAQUE_REF_RE = /OpaqueRef:[0-9a-z-]+/
  const matches = OPAQUE_REF_RE.exec(str)
  if (!matches) {
    throw new Error('no opaque ref found')
  }
  return matches[0]
}
exports.MixinReplicationWriter = (BaseClass = Object) =>
  class MixinReplicationWriter extends BaseClass {
    constructor({ sr, ...rest }) {
      super(rest)

      this._sr = sr
    }

    healthCheck(sr) {
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
