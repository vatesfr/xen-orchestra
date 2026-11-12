import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { forbiddenOperation } from 'xo-common/api-errors.js'
import type { Request, Response } from 'express'
import type { XoUser, XoVm } from '@vates/types'

import genericErrorHandler from '../middlewares/generic-error-handler.middleware.mjs'
import { VmController } from './vm.controller.mjs'
import { VmService } from './vm.service.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

const user = { id: 'user-1', permission: 'none' } as XoUser
const vm = { id: 'vm-1', $pool: 'pool-1', tags: ['vdf:quarantine', 'web'] } as unknown as XoVm

// a restApi whose xoApp refuses every reserved tag change, recording the checks and the writes
function createRestApi() {
  const checks: unknown[] = []
  const writes: unknown[] = []
  const restApi = {
    getCurrentUser: () => user,
    getObject: () => vm,
    getXapiObject: () => ({ $call: async (...args: unknown[]) => writes.push(args) }),
    ioc: { get: () => ({}) },
    xoApp: {
      async checkTagsChange(...args: unknown[]) {
        checks.push(args)
        forbiddenOperation('remove tag vdf:quarantine', 'the tag "vdf:quarantine" belongs to the firewall')
      },
      diffTags: (oldTags: string[], newTags: string[]) => ({
        added: newTags.filter(tag => !oldTags.includes(tag)),
        removed: oldTags.filter(tag => !newTags.includes(tag)),
      }),
      getXapi: () => ({ editVm: async (...args: unknown[]) => writes.push(args) }),
    },
  } as unknown as RestApi
  return { checks, restApi, writes }
}

// the status the REST API answers for an error
function statusOf(error: unknown) {
  let status: number | undefined
  const res = {
    headersSent: false,
    status(code: number) {
      status = code
      return this
    },
    json() {},
    setHeader() {},
  }
  genericErrorHandler(error, { method: 'DELETE', path: '/' } as Request, res as unknown as Response, () => {})
  return status
}

describe('VM tags', () => {
  it('answers 403 to a refused tag write, without writing the tag', async () => {
    const { checks, restApi, writes } = createRestApi()
    const controller = new VmController(restApi, {} as never, {} as never)

    const error = await controller.deleteVmTag('vm-1', 'vdf:quarantine').then(
      () => assert.fail('the tag was removed'),
      error => error
    )

    assert.equal(statusOf(error), 403)
    assert.deepEqual(checks, [[user, vm, { removed: ['vdf:quarantine'] }]])
    assert.deepEqual(writes, [])
  })

  it('checks the tags a VM update actually changes, before editing the VM', async () => {
    const { checks, restApi, writes } = createRestApi()
    const service = new VmService(restApi)

    await assert.rejects(service.updateVm('vm-1' as XoVm['id'], { tags: ['web', 'db'] }), forbiddenOperation.is)

    assert.deepEqual(checks, [[user, vm, { added: ['db'], removed: ['vdf:quarantine'] }]])
    assert.deepEqual(writes, [])
  })
})
