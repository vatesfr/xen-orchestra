import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { getSelfVmUuid, resolveSelfVmRef } from './_self.mjs'

const UUID = '0e3b8f2a-5c1d-4a7e-9f10-2b6d4c8e1a33'

const failing = (code, stderr) => () => {
  const error = new Error(code)
  error.code = code
  error.stderr = stderr
  return Promise.reject(error)
}

describe('getSelfVmUuid', () => {
  it('extracts the uuid from the XenStore VM entry', async () => {
    assert.equal(await getSelfVmUuid({ readXenStore: async () => `/vm/${UUID}` }), UUID)
  })

  it('tolerates the trailing newline the command leaves', async () => {
    assert.equal(await getSelfVmUuid({ readXenStore: async () => `/vm/${UUID}\n` }), UUID)
  })

  it('rejects an entry which is not a path', async () => {
    for (const entry of ['', UUID, '/vm/']) {
      await assert.rejects(
        getSelfVmUuid({ readXenStore: async () => entry }),
        /incorrect XenStore VM entry/,
        `should have refused ${JSON.stringify(entry)}`
      )
    }
  })

  it('says the appliance is not a VM when the command is missing', async () => {
    await assert.rejects(
      getSelfVmUuid({ readXenStore: failing('ENOENT') }),
      /must run inside an XCP-ng VM to use a read cache/
    )
  })

  it('says root is needed when xenstored refuses the read', async () => {
    await assert.rejects(
      getSelfVmUuid({ readXenStore: failing(1, 'xenstore-read: Could not read path vm: Permission denied\n') }),
      /requires root privileges/
    )
  })

  it('propagates any other failure as is', async () => {
    await assert.rejects(getSelfVmUuid({ readXenStore: failing('EPIPE', 'broken') }), { code: 'EPIPE' })
  })
})

describe('resolveSelfVmRef', () => {
  it('resolves the appliance own VM', async () => {
    const calls = []
    const xapi = {
      async call(...args) {
        calls.push(args)
        return 'OpaqueRef:self'
      },
    }
    assert.equal(await resolveSelfVmRef(xapi, UUID), 'OpaqueRef:self')
    assert.deepEqual(calls, [['VM.get_by_uuid', UUID]])
  })

  it('explains that the appliance belongs to another pool', async () => {
    const xapi = {
      async call() {
        const error = new Error('UUID_INVALID')
        error.code = 'UUID_INVALID'
        throw error
      },
    }
    await assert.rejects(resolveSelfVmRef(xapi, UUID), error => {
      assert.match(error.message, /to be a VM of the pool the disk is mounted onto/)
      assert.match(error.message, new RegExp(UUID))
      // the original failure stays reachable for the logs
      assert.equal(error.cause.code, 'UUID_INVALID')
      return true
    })
  })

  it('propagates any other XAPI failure as is', async () => {
    const xapi = {
      async call() {
        const error = new Error('SESSION_INVALID')
        error.code = 'SESSION_INVALID'
        throw error
      },
    }
    await assert.rejects(resolveSelfVmRef(xapi, UUID), { code: 'SESSION_INVALID' })
  })
})
