import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { isNotInXenVm } from './_XenStore.mjs'

// what the callback form of `execFile` rejects with when the command ran and failed: its output is
// only in the message
const commandFailure = stderr => Object.assign(new Error(`Command failed: xenstore-read vm\n${stderr}`), { code: 1 })

describe('isNotInXenVm', () => {
  it('recognizes a system without the XenStore client', () => {
    // as `xenStoreExec` wraps it
    const error = new Error('xenstore-read not found', { cause: Object.assign(new Error('spawn'), { code: 'ENOENT' }) })
    assert.equal(isNotInXenVm(error), true)
  })

  it('recognizes a client with no XenStore to talk to', () => {
    assert.equal(isNotInXenVm(commandFailure('xenstore-read: xs_open: No such file or directory\n')), true)
  })

  it('does not hide a VM whose XenStore XO is not allowed to read', () => {
    // as `xenStoreExec` wraps it
    const error = new Error('xenstore-read requires root privileges', {
      cause: commandFailure('xenstore-read: xs_open: Permission denied\n'),
    })
    assert.equal(isNotInXenVm(error), false)
  })

  it('does not hide any other failure', () => {
    assert.equal(isNotInXenVm(commandFailure("xenstore-read: couldn't read path vm\n")), false)
    assert.equal(isNotInXenVm(new Error('incorrect XenStore VM entry: ')), false)
  })
})
