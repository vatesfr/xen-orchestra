import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { forbiddenOperation, placementRefused } from 'xo-common/api-errors.js'
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

// a restApi whose XAPI clones, copies and creates VMs, recording in order what happens to the new VM
function createRestApiForNewVm({ strip = async () => [] as string[] } = {}) {
  const events: unknown[] = []
  const newVm = {
    $ref: 'OpaqueRef:new-vm',
    uuid: 'new-vm',
    $callAsync: async (...args: unknown[]) => events.push(['$callAsync', ...args]),
  }
  const xapi = {
    cloneVm: async () => newVm,
    copyVm: async () => newVm,
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
      async stripInheritedReservedTagsOrDestroy(...args: unknown[]) {
        events.push(['stripInheritedReservedTagsOrDestroy', ...args])
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
    assert.deepEqual(events, [['stripInheritedReservedTagsOrDestroy', user, newVm]])
  })

  it('fails a clone or a copy with the error of the strip that destroys the new VM when it fails', async () => {
    const error = new Error('XAPI is down')
    const { events, newVm, restApi } = createRestApiForNewVm({
      strip: async () => {
        throw error
      },
    })
    const controller = new VmController(restApi, {} as never, {} as never)

    await assert.rejects(controller.cloneVm('vm-1', { fast: true }, true), error)
    await assert.rejects(controller.cloneVm('vm-1', { srId: 'sr-1' }, true), error)
    assert.deepEqual(events, [
      ['stripInheritedReservedTagsOrDestroy', user, newVm],
      ['stripInheritedReservedTagsOrDestroy', user, newVm],
    ])
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

// a restApi with a VM in pool-1 and a host in pool-2, whose XAPI records the migrations
function createRestApiForMigrate({ refuse }: { refuse: boolean }) {
  const checks: unknown[] = []
  const migrations: unknown[] = []
  const host = { id: 'host-2', $pool: 'pool-2' }
  const restApi = {
    getCurrentUser: () => user,
    getObject: (id: string, type: string) => (type === 'host' ? host : vm),
    getXapiObject: () => ({ $xapi: { migrateVm: async (...args: unknown[]) => migrations.push(args) } }),
    ioc: { get: () => ({}) },
    tasks: { create: () => ({ id: 'task-1', run: (fn: () => unknown) => fn() }) },
    xoApp: {
      async checkMigration(...args: unknown[]) {
        checks.push(args)
        if (refuse) {
          forbiddenOperation('migrate VM to another pool', 'the VM carries firewall tags')
        }
      },
      checkPlacement: async () => {},
      getXapi: () => ({}),
    },
  } as unknown as RestApi
  return { checks, migrations, restApi }
}

describe('VM migration', () => {
  it('answers 403 to a refused migration to another pool, without migrating the VM', async () => {
    const { checks, migrations, restApi } = createRestApiForMigrate({ refuse: true })
    const controller = new VmController(restApi, {} as never, {} as never)

    const error = await controller.migrateVm('vm-1', { hostId: 'host-2' }).then(
      () => assert.fail('the VM was migrated'),
      error => error
    )

    assert.equal(statusOf(error), 403)
    assert.deepEqual(checks, [[user, vm, 'pool-2']])
    assert.deepEqual(migrations, [])
  })

  it('migrates the VM once the destination pool is checked', async () => {
    const { checks, migrations, restApi } = createRestApiForMigrate({ refuse: false })
    const controller = new VmController(restApi, {} as never, {} as never)

    await controller.migrateVm('vm-1', { hostId: 'host-2' }, true)

    assert.deepEqual(checks, [[user, vm, 'pool-2']])
    assert.equal(migrations.length, 1)
  })
})

// a restApi whose placement guards refuse (`refuse`) or not, recording what
// they're asked and what XAPI is asked to do
function createRestApiForPlacement({ refuse }: { refuse: boolean }) {
  const checks: Record<string, unknown>[] = []
  const calls: unknown[] = []
  const host = { id: 'host-2', $pool: 'pool-1' }
  const record =
    (name: string) =>
    async (...args: unknown[]) =>
      calls.push([name, ...args])
  const xapi = { startVm: record('startVm'), resumeVm: record('resumeVm'), migrateVm: record('migrateVm') }
  const restApi = {
    getCurrentUser: () => user,
    getObject: (id: string, type: string) => (type === 'host' ? host : vm),
    getXapi: () => xapi,
    getXapiObject: () => ({ $xapi: xapi }),
    ioc: { get: () => ({}) },
    tasks: { create: () => ({ id: 'task-1', run: (fn: () => unknown) => fn() }) },
    xoApp: {
      checkMigration: async () => {},
      async checkPlacement(params: Record<string, unknown>) {
        checks.push(params)
        if (refuse) {
          placementRefused({
            operation: params.operation,
            vm: { id: 'vm-1' },
            host: { id: 'host-2' },
            guard: 'firewall',
            reason: 'no firewall agent on host "host-2"',
            bypass: { parameter: 'bypassFirewallCheck', allowed: false, who: 'XO administrators' },
          })
        }
      },
      getXapi: () => xapi,
    },
  } as unknown as RestApi
  return { calls, checks, host, restApi }
}

describe('placement guards', () => {
  it('answers 403 to a refused start, resume or migration, with the reason, before anything is asked of XAPI', async () => {
    const { calls, checks, restApi } = createRestApiForPlacement({ refuse: true })
    const controller = new VmController(restApi, {} as never, {} as never)

    for (const action of [
      () => controller.startVm('vm-1', { hostId: 'host-2' }),
      () => controller.resumeVm('vm-1'),
      () => controller.migrateVm('vm-1', { hostId: 'host-2', networkIdByVifId: { 'vif-1': 'net-1' } }),
    ]) {
      const error = await action().then(
        () => assert.fail('the VM was placed'),
        error => error
      )
      assert.equal(statusOf(error), 403)
      assert.equal(error.data.reason, 'no firewall agent on host "host-2"')
    }

    assert.deepEqual(
      checks.map(({ operation, host, vifNetworks }) => [
        operation,
        (host as { id: string } | undefined)?.id,
        vifNetworks,
      ]),
      [
        ['start', 'host-2', undefined],
        ['resume', undefined, undefined],
        ['migrate', 'host-2', { 'vif-1': 'net-1' }],
      ]
    )
    assert.deepEqual(calls, [])
  })

  it('passes the user, the VM and the override, then starts the VM where XAPI picks', async () => {
    const { calls, checks, restApi } = createRestApiForPlacement({ refuse: false })
    const controller = new VmController(restApi, {} as never, {} as never)

    await controller.startVm('vm-1', { bypassFirewallCheck: true }, true)

    assert.deepEqual(checks, [{ operation: 'start', user, vm, host: undefined, bypass: true }])
    assert.deepEqual(calls, [['startVm', 'vm-1', { startOnly: true, hostId: undefined }]])
  })
})
