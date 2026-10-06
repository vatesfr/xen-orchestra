import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { hasLiveMountTarget, normalizeVdiRestoreTargets } from './_vdiRestoreTargets.mjs'

const VDI_1 = 'vdi-uuid-1'
const VDI_2 = 'vdi-uuid-2'
const VDI_3 = 'vdi-uuid-3'
const SR = 'sr-uuid'
const HOST = 'host-uuid'

describe('normalizeVdiRestoreTargets()', () => {
  describe('legacy shape', () => {
    it('maps an SR uuid to a restore', () => {
      const targets = normalizeVdiRestoreTargets({ [VDI_1]: SR })
      assert.deepEqual(targets.get(VDI_1), { type: 'restore', sr: SR, useDifferential: false })
    })

    it('maps null to an ignore', () => {
      const targets = normalizeVdiRestoreTargets({ [VDI_1]: null })
      assert.deepEqual(targets.get(VDI_1), { type: 'ignore' })
      assert.deepEqual([...targets.getIgnoredVdiUuids()], [VDI_1])
    })

    it('propagates the job wide differential setting', () => {
      const targets = normalizeVdiRestoreTargets({ [VDI_1]: SR }, { useDifferentialRestore: true })
      assert.equal(targets.get(VDI_1).useDifferential, true)
    })
  })

  describe('default target', () => {
    it('restores a VDI which has no entry onto the default SR', () => {
      const targets = normalizeVdiRestoreTargets({ [VDI_1]: SR })
      assert.deepEqual(targets.get(VDI_2), { type: 'restore', sr: undefined, useDifferential: false })
    })

    it('handles an undefined setting', () => {
      const targets = normalizeVdiRestoreTargets(undefined)
      assert.deepEqual(targets.get(VDI_1), { type: 'restore', sr: undefined, useDifferential: false })
      assert.equal(targets.getIgnoredVdiUuids().size, 0)
      assert.equal(targets.getLiveMountedVdiUuids().size, 0)
      assert.equal(targets.getLiveMountHost(), undefined)
    })

    it('carries the job wide differential setting', () => {
      const targets = normalizeVdiRestoreTargets({}, { useDifferentialRestore: true })
      assert.equal(targets.get(VDI_1).useDifferential, true)
    })
  })

  describe('current shape', () => {
    it('handles the three types at once', () => {
      const targets = normalizeVdiRestoreTargets({
        [VDI_1]: { type: 'restore', sr: SR },
        [VDI_2]: { type: 'live-mount', host: HOST },
        [VDI_3]: { type: 'ignore' },
      })

      assert.deepEqual(targets.get(VDI_1), { type: 'restore', sr: SR, useDifferential: false })
      assert.deepEqual(targets.get(VDI_2), { type: 'live-mount', host: HOST })
      assert.deepEqual(targets.get(VDI_3), { type: 'ignore' })
      assert.deepEqual([...targets.getLiveMountedVdiUuids()], [VDI_2])
      assert.deepEqual([...targets.getIgnoredVdiUuids()], [VDI_3])
      assert.equal(targets.getLiveMountHost(), HOST)
    })

    it('accepts a restore without SR', () => {
      const targets = normalizeVdiRestoreTargets({ [VDI_1]: { type: 'restore' } })
      assert.deepEqual(targets.get(VDI_1), { type: 'restore', sr: undefined, useDifferential: false })
    })

    it('rejects a null SR, which already means "do not restore this disk"', () => {
      assert.throws(
        () => normalizeVdiRestoreTargets({ [VDI_1]: { type: 'restore', sr: null } }),
        /use { type: "ignore" }/
      )
    })

    it('ignores a per disk useDifferential and uses the job setting', () => {
      const targets = normalizeVdiRestoreTargets(
        { [VDI_1]: { type: 'restore', useDifferential: false } },
        { useDifferentialRestore: true }
      )
      assert.equal(targets.get(VDI_1).useDifferential, true)
    })
  })

  describe('validation', () => {
    it('rejects an unknown type', () => {
      assert.throws(() => normalizeVdiRestoreTargets({ [VDI_1]: { type: 'mount' } }), /unknown type "mount"/)
    })

    it('rejects a live mount without host', () => {
      assert.throws(
        () => normalizeVdiRestoreTargets({ [VDI_1]: { type: 'live-mount' } }),
        /requires the id of the host/
      )
    })

    it('rejects a non string SR', () => {
      assert.throws(() => normalizeVdiRestoreTargets({ [VDI_1]: { type: 'restore', sr: 42 } }), /expected an SR uuid/)
    })

    it('rejects a value which is neither an object, a string nor null', () => {
      assert.throws(() => normalizeVdiRestoreTargets({ [VDI_1]: 42 }), /expected an object, an SR uuid or null/)
    })

    it('names the faulty VDI', () => {
      assert.throws(() => normalizeVdiRestoreTargets({ [VDI_2]: { type: 'nope' } }), new RegExp(VDI_2))
    })

    it('rejects live mounts spread over multiple hosts', () => {
      const targets = normalizeVdiRestoreTargets({
        [VDI_1]: { type: 'live-mount', host: HOST },
        [VDI_2]: { type: 'live-mount', host: 'another-host' },
      })
      assert.throws(() => targets.getLiveMountHost(), /must use the same host/)
    })
  })
})

describe('hasLiveMountTarget()', () => {
  it('detects a live mount entry', () => {
    assert.equal(hasLiveMountTarget({ [VDI_1]: SR, [VDI_2]: { type: 'live-mount', host: HOST } }), true)
  })

  it('is false for every other shape', () => {
    assert.equal(hasLiveMountTarget(undefined), false)
    assert.equal(hasLiveMountTarget({}), false)
    assert.equal(hasLiveMountTarget({ [VDI_1]: SR, [VDI_2]: null, [VDI_3]: { type: 'ignore' } }), false)
  })
})
