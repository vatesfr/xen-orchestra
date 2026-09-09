import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  CONTENT_KEY,
  COPY_OF,
  DATETIME,
  DELTA_CHAIN_LENGTH,
  EXPORTED_SUCCESSFULLY,
  INCLUDE_NON_NBD_QCOW2_FIX,
  JOB_ID,
  REPLICATED_TO_SR_UUID,
  SCHEDULE_ID,
  VM_UUID,
  resetVmOtherConfig,
} from './_otherConfig.mjs'

// Records the other_config entries written per object, which is all resetVmOtherConfig does.
const makeXapi = vdiRefs => {
  const writes = {}
  return {
    writes,
    VM_getDisks: async () => vdiRefs,
    setFieldEntries: async (type, ref, field, entries) => {
      assert.equal(field, 'other_config')
      writes[ref] = { type, entries }
    },
  }
}

const REPLICA_IDENTITY_KEYS = [DATETIME, JOB_ID, SCHEDULE_ID, VM_UUID]
const CHAIN_MARKER_KEYS = [CONTENT_KEY, COPY_OF, DELTA_CHAIN_LENGTH, EXPORTED_SUCCESSFULLY, INCLUDE_NON_NBD_QCOW2_FIX]

describe('resetVmOtherConfig()', () => {
  it('clears every backup key on the VM and its VDIs by default', async () => {
    const xapi = makeXapi(['vdi-1', 'vdi-2'])

    await resetVmOtherConfig(xapi, 'vm-ref')

    for (const ref of ['vm-ref', 'vdi-1', 'vdi-2']) {
      const { entries } = xapi.writes[ref]
      for (const key of [...REPLICA_IDENTITY_KEYS, ...CHAIN_MARKER_KEYS]) {
        assert.equal(entries[key], null, `${key} should be cleared on ${ref}`)
      }
    }
  })

  it('never clears REPLICATED_TO_SR_UUID, so a replication can be replicated', async () => {
    const xapi = makeXapi(['vdi-1'])

    await resetVmOtherConfig(xapi, 'vm-ref', { isReplicationTarget: true })

    for (const ref of ['vm-ref', 'vdi-1']) {
      assert.equal(REPLICATED_TO_SR_UUID in xapi.writes[ref].entries, false)
    }
  })
})

describe('regression: a replication target VM loses the keys retention finds it by', () => {
  it('keeps the replica identity keys on the VM when isReplicationTarget is set', async () => {
    const xapi = makeXapi(['vdi-1'])

    await resetVmOtherConfig(xapi, 'vm-ref', { isReplicationTarget: true })

    const { entries } = xapi.writes['vm-ref']
    for (const key of REPLICA_IDENTITY_KEYS) {
      // clearing these made the target VM invisible to listReplicatedVms(), so a target
      // abandoned by a later run could never be collected and replicas piled up
      assert.equal(key in entries, false, `${key} should be left untouched on a replication target VM`)
    }
  })

  it('still clears the chain markers on the VM, so it cannot be picked as a base', async () => {
    const xapi = makeXapi(['vdi-1'])

    await resetVmOtherConfig(xapi, 'vm-ref', { isReplicationTarget: true })

    const { entries } = xapi.writes['vm-ref']
    for (const key of CHAIN_MARKER_KEYS) {
      assert.equal(entries[key], null, `${key} should be cleared even on a replication target VM`)
    }
  })

  it('still clears everything on the VDIs, whose markers live on the snapshots', async () => {
    const xapi = makeXapi(['vdi-1', 'vdi-2'])

    await resetVmOtherConfig(xapi, 'vm-ref', { isReplicationTarget: true })

    for (const ref of ['vdi-1', 'vdi-2']) {
      const { type, entries } = xapi.writes[ref]
      assert.equal(type, 'VDI')
      for (const key of [...REPLICA_IDENTITY_KEYS, ...CHAIN_MARKER_KEYS]) {
        assert.equal(entries[key], null, `${key} should be cleared on ${ref}`)
      }
    }
  })
})
