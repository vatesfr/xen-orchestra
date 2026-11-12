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

// a restApi whose XAPI clones and creates VMs, recording in order what happens to the new VM
function createRestApiForNewVm({ strip = async () => [] as string[] } = {}) {
  const events: unknown[] = []
  const newVm = {
    $ref: 'OpaqueRef:new-vm',
    uuid: 'new-vm',
    $callAsync: async (...args: unknown[]) => events.push(['$callAsync', ...args]),
  }
  const xapi = {
    cloneVm: async () => newVm,
    createVm: async () => newVm,
    VM_destroy: async (ref: string) => events.push(['VM_destroy', ref]),
  }
  const restApi = {
    getCurrentUser: () => user,
    getObject: () => vm,
    getXapi: () => xapi,
    ioc: { get: () => ({}) },
    tasks: { create: () => ({ id: 'task-1', run: (fn: () => unknown) => fn() }) },
    xoApp: {
      getXapi: () => xapi,
      async stripInheritedReservedTags(...args: unknown[]) {
        events.push(['stripInheritedReservedTags', ...args])
        return strip()
      },
    },
  } as unknown as RestApi
  return { events, newVm, restApi }
}

describe('new VMs', () => {
  it('strips the reserved tags the user may not add from a clone, before returning it', async () => {
    const { events, newVm, restApi } = createRestApiForNewVm()
    const controller = new VmController(restApi, {} as never, {} as never)

    assert.deepEqual(await controller.cloneVm('vm-1', { fast: true }, true), { id: 'new-vm' })
    assert.deepEqual(events, [['stripInheritedReservedTags', user, newVm]])
  })

  it('strips the reserved tags the user may not add from an instance of a template, before booting it', async () => {
    const { events, newVm, restApi } = createRestApiForNewVm()
    const service = new VmService(restApi)

    await service.create({ boot: true, name_label: 'vm', pool: 'pool-1', template: 'template-1' } as never)
    assert.deepEqual(events, [
      ['stripInheritedReservedTags', user, newVm],
      ['$callAsync', 'start', false, false],
    ])
  })

  it('destroys an instance of a template without booting it if its reserved tags cannot be stripped', async () => {
    const error = new Error('XAPI is down')
    const { events, restApi } = createRestApiForNewVm({
      strip: async () => {
        throw error
      },
    })
    const service = new VmService(restApi)

    await assert.rejects(
      service.create({ boot: true, name_label: 'vm', pool: 'pool-1', template: 'template-1' } as never),
      error
    )
    assert.deepEqual(events.slice(1), [['VM_destroy', 'OpaqueRef:new-vm']])
  })
})
