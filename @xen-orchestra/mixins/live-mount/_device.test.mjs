import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { waitForVbdDevice } from './_device.mjs'

const VBD_REF = 'OpaqueRef:vbd'

/** A `stat` answering for a fixed set of existing block devices. */
const makeStat = (blockDevices, { calls = [] } = {}) => {
  const stat = async path => {
    calls.push(path)
    if (!blockDevices.has(path)) {
      const error = new Error(`ENOENT: no such file or directory, stat '${path}'`)
      error.code = 'ENOENT'
      throw error
    }
    return { isBlockDevice: () => blockDevices.get(path) }
  }
  stat.calls = calls
  return stat
}

/** A XAPI whose `device` field is empty for the first `emptyReads` polls. */
const makeXapi = (device, { emptyReads = 0 } = {}) => {
  let reads = 0
  return {
    get reads() {
      return reads
    },
    async getField(type, ref, field) {
      assert.equal(type, 'VBD')
      assert.equal(ref, VBD_REF)
      assert.equal(field, 'device')
      return reads++ < emptyReads ? '' : device
    },
  }
}

// every test pins pollInterval to 1ms: what is asserted is the polling logic,
// not how long it sleeps
const FAST = { pollInterval: 1 }

describe('waitForVbdDevice', () => {
  it('returns the device path once XAPI names it and the node exists', async () => {
    const xapi = makeXapi('xvdc')
    const stat = makeStat(new Map([['/dev/xvdc', true]]))
    assert.equal(await waitForVbdDevice(xapi, VBD_REF, { ...FAST, stat }), '/dev/xvdc')
    assert.equal(xapi.reads, 1)
    assert.deepEqual(stat.calls, ['/dev/xvdc'])
  })

  it('waits for XAPI to fill the device field', async () => {
    const xapi = makeXapi('xvdd', { emptyReads: 3 })
    const stat = makeStat(new Map([['/dev/xvdd', true]]))
    assert.equal(await waitForVbdDevice(xapi, VBD_REF, { ...FAST, stat }), '/dev/xvdd')
    assert.equal(xapi.reads, 4)
  })

  it('waits for udev to create the node', async () => {
    const blockDevices = new Map()
    const stat = makeStat(blockDevices)
    const promise = waitForVbdDevice(makeXapi('xvde'), VBD_REF, { ...FAST, stat })
    setTimeout(() => blockDevices.set('/dev/xvde', true), 10)
    assert.equal(await promise, '/dev/xvde')
    assert.ok(stat.calls.length > 1, 'the node was polled more than once')
  })

  it('reports a device XAPI never names, distinctly from a node that never appears', async () => {
    const stat = makeStat(new Map([['/dev/xvdc', true]]))
    await assert.rejects(
      waitForVbdDevice(makeXapi(''), VBD_REF, { ...FAST, deviceFieldTimeout: 5, stat }),
      /XAPI never named its device after 5ms/
    )
  })

  it('reports a node that never appears', async () => {
    await assert.rejects(
      waitForVbdDevice(makeXapi('xvdc'), VBD_REF, { ...FAST, deviceNodeTimeout: 5, stat: makeStat(new Map()) }),
      /\/dev\/xvdc never appeared after 5ms/
    )
  })

  it('keeps waiting on a path which exists but is not a block device', async () => {
    // e.g. a leftover regular file in a container's /dev: opening it read/write
    // would be far worse than timing out
    await assert.rejects(
      waitForVbdDevice(makeXapi('xvdc'), VBD_REF, {
        ...FAST,
        deviceNodeTimeout: 5,
        stat: makeStat(new Map([['/dev/xvdc', false]])),
      }),
      /never appeared/
    )
  })

  it('refuses a device name that is not one, rather than building a path from it', async () => {
    for (const device of ['../../etc/shadow', 'foo/bar', '/dev/xvdc', 'xvd c']) {
      await assert.rejects(
        waitForVbdDevice(makeXapi(device), VBD_REF, { ...FAST, stat: makeStat(new Map()) }),
        /unusable device name/,
        `should have refused ${device}`
      )
    }
  })

  it('propagates a stat failure which is not a missing node', async () => {
    const stat = async () => {
      const error = new Error('EACCES')
      error.code = 'EACCES'
      throw error
    }
    await assert.rejects(waitForVbdDevice(makeXapi('xvdc'), VBD_REF, { ...FAST, stat }), { code: 'EACCES' })
  })

  it('checks once even with a zero timeout', async () => {
    const stat = makeStat(new Map([['/dev/xvdc', true]]))
    assert.equal(
      await waitForVbdDevice(makeXapi('xvdc'), VBD_REF, {
        ...FAST,
        deviceFieldTimeout: 0,
        deviceNodeTimeout: 0,
        stat,
      }),
      '/dev/xvdc'
    )
  })
})
