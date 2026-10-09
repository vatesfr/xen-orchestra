import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { computeObjectNotifications } from './_objectNotifications.mjs'

// ===================================================================

const VM_1 = { id: 'vm-1', type: 'VM' }
const VM_2 = { id: 'vm-2', type: 'VM' }

// mimics what `Xo#_watchObjects` accumulates between two `finish` events
const entered = (...objects) => Object.fromEntries(objects.map(object => [object.id, object]))
const exited = (...ids) => Object.fromEntries(ids.map(id => [id, 0]))

const onlyVm1 = id => id === 'vm-1'

// ===================================================================

describe('computeObjectNotifications', function () {
  it('forwards everything when there is no predicate, as for an admin', function () {
    const { enter, exit } = computeObjectNotifications({
      entered: entered(VM_1, VM_2),
      exited: exited('vm-3'),
      isObjectVisible: undefined,
    })

    assert.deepEqual({ ...enter }, { 'vm-1': VM_1, 'vm-2': VM_2 })
    assert.deepEqual({ ...exit }, { 'vm-3': 0 })
  })

  it('drops entered objects the user cannot see', function () {
    const { enter } = computeObjectNotifications({
      entered: entered(VM_1, VM_2),
      exited: {},
      isObjectVisible: onlyVm1,
    })

    assert.deepEqual({ ...enter }, { 'vm-1': VM_1 })
  })

  // an object can leave the user's scope without being destroyed, e.g. a VM
  // migrated to a host they cannot see: it reaches us as an update, and the
  // client must be told to forget it rather than keep a stale copy
  it('reports an entered object the user cannot see as exited', function () {
    const { enter, exit } = computeObjectNotifications({
      entered: entered(VM_1, VM_2),
      exited: {},
      isObjectVisible: onlyVm1,
    })

    assert.deepEqual({ ...enter }, { 'vm-1': VM_1 })
    assert.deepEqual({ ...exit }, { 'vm-2': 0 })
  })

  // the object is already gone from the collection when `exit` is emitted, so
  // its visibility can no longer be evaluated: exits carry ids only and are
  // forwarded to everyone
  it('forwards exits regardless of visibility', function () {
    const { exit } = computeObjectNotifications({
      entered: {},
      exited: exited('vm-2'),
      isObjectVisible: onlyVm1,
    })

    assert.deepEqual({ ...exit }, { 'vm-2': 0 })
  })

  it('merges invisible entries into the existing exits', function () {
    const { exit } = computeObjectNotifications({
      entered: entered(VM_2),
      exited: exited('vm-3'),
      isObjectVisible: onlyVm1,
    })

    assert.deepEqual({ ...exit }, { 'vm-2': 0, 'vm-3': 0 })
  })

  it('returns no message when there is nothing to send', function () {
    const { enter, exit } = computeObjectNotifications({
      entered: {},
      exited: {},
      isObjectVisible: onlyVm1,
    })

    assert.equal(enter, undefined)
    assert.equal(exit, undefined)
  })

  it('returns no enter message when every entered object is hidden', function () {
    const { enter } = computeObjectNotifications({
      entered: entered(VM_2),
      exited: {},
      isObjectVisible: onlyVm1,
    })

    assert.equal(enter, undefined)
  })

  // the same batch is used to build the messages of every connection
  it('does not mutate the batch it was given', function () {
    const enteredBatch = entered(VM_1, VM_2)
    const exitedBatch = exited('vm-3')

    computeObjectNotifications({ entered: enteredBatch, exited: exitedBatch, isObjectVisible: onlyVm1 })

    assert.deepEqual(enteredBatch, { 'vm-1': VM_1, 'vm-2': VM_2 })
    assert.deepEqual(exitedBatch, { 'vm-3': 0 })
  })
})
