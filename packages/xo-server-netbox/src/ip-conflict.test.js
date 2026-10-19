import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { resolveIpConflict } from './ip-conflict.js'

const halted1 = { vm: 'halted1', running: false }
const halted2 = { vm: 'halted2', running: false }
const running1 = { vm: 'running1', running: true }
const running2 = { vm: 'running2', running: true }
const managed = vm => ({ managed: true, ...vm })

describe('resolveIpConflict', () => {
  it('reuses an unassigned IP for the only VM reporting it', () => {
    assert.deepEqual(resolveIpConflict([halted1], undefined), { owner: halted1 })
  })

  it('never takes an IP from an object not managed by XO', () => {
    const { owner, reason } = resolveIpConflict([running1], { managed: false })
    assert.equal(owner, undefined)
    assert.notEqual(reason, undefined)
  })

  it('assigns an unassigned IP to the only running VM', () => {
    const { owner, reason } = resolveIpConflict([halted1, running1, halted2], undefined)
    assert.equal(owner, running1)
    assert.notEqual(reason, undefined)
  })

  it('moves the IP from a halted holder to the only running VM', () => {
    const { owner } = resolveIpConflict([running1], managed(halted1))
    assert.equal(owner, running1)
  })

  it('keeps the IP on a running holder', () => {
    const holder = managed(running1)
    const { owner, reason } = resolveIpConflict([halted1], holder)
    assert.equal(owner, holder)
    assert.notEqual(reason, undefined)
  })

  it('keeps the IP on the holder if several VMs are running', () => {
    const holder = managed(halted1)
    const { owner, reason } = resolveIpConflict([running1, running2], holder)
    assert.equal(owner, holder)
    assert.notEqual(reason, undefined)
  })

  it('keeps the IP on the holder if all VMs are halted', () => {
    const holder = managed(halted1)
    const { owner } = resolveIpConflict([halted2], holder)
    assert.equal(owner, holder)
  })

  it('does not assign an unassigned IP if no VM can be chosen', () => {
    assert.equal(resolveIpConflict([running1, running2], undefined).owner, undefined)
    assert.equal(resolveIpConflict([halted1, halted2], undefined).owner, undefined)
  })
})
