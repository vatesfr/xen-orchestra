import * as assert from 'node:assert'
import { test, suite } from 'node:test'
import { createClassNameFixer } from '../src/event_store.mjs'

suite('createClassNameFixer', function () {
  test('restores class names and preserves event and batch fields without mutating the input', function () {
    const fix = createClassNameFixer({ VM: {}, VBD: {}, host: {} })
    const snapshot = { uuid: 'uuid-1' }
    const batch = {
      token: 'token-1',
      events: [
        { class: 'vm', operation: 'add', ref: 'ref-1', snapshot },
        { class: 'vbd', operation: 'del', ref: 'ref-2' },
        { class: 'host', operation: 'mod', ref: 'ref-3' },
      ],
      valid_ref_counts: { vm: 2, vbd: 0, host: 1 },
    }
    const original = structuredClone(batch)

    const result = fix(batch)

    assert.deepStrictEqual(result, {
      token: 'token-1',
      events: [
        { class: 'VM', operation: 'add', ref: 'ref-1', snapshot },
        { class: 'VBD', operation: 'del', ref: 'ref-2' },
        { class: 'host', operation: 'mod', ref: 'ref-3' },
      ],
      valid_ref_counts: { VM: 2, VBD: 0, host: 1 },
    })
    assert.deepStrictEqual(batch, original)
    assert.notStrictEqual(result, batch)
    assert.notStrictEqual(result.events, batch.events)
    assert.notStrictEqual(result.valid_ref_counts, batch.valid_ref_counts)
    for (let i = 0; i < batch.events.length; i++) {
      assert.notStrictEqual(result.events[i], batch.events[i])
    }
    assert.strictEqual(result.events[0].snapshot, snapshot)
  })

  test('retains unknown events with an undefined class and removes unknown counts', function () {
    const fix = createClassNameFixer({ VM: {} })
    const result = fix({
      events: [
        { class: 'unknown', ref: 'ref-1' },
        { class: 'vm', ref: 'ref-2' },
      ],
      valid_ref_counts: { unknown: 3, vm: 1 },
    })

    assert.deepStrictEqual(result, {
      events: [
        { class: undefined, ref: 'ref-1' },
        { class: 'VM', ref: 'ref-2' },
      ],
      valid_ref_counts: { VM: 1 },
    })
  })

  test('handles empty batches and can be reused', function () {
    const fix = createClassNameFixer({ VM: {} })
    assert.deepStrictEqual(fix({ token: 'empty', events: [], valid_ref_counts: {} }), {
      token: 'empty',
      events: [],
      valid_ref_counts: {},
    })
    assert.deepStrictEqual(fix({ events: [{ class: 'vm' }], valid_ref_counts: { vm: 1 } }), {
      events: [{ class: 'VM' }],
      valid_ref_counts: { VM: 1 },
    })
  })
})
