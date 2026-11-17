import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { XoApp } from '@vates/types/xo-app'
import type { XoPool } from '@vates/types'

import { PoolController } from './pool.controller.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

const pool = { id: 'pool-1', name_label: 'pool 1' } as XoPool

type RollingOpts = NonNullable<Parameters<XoApp['rollingPoolUpdate']>[1]>

function createController({ v2vService = {} }: { v2vService?: object } = {}) {
  const calls: unknown[] = []
  const record =
    (orchestrator: string) =>
    async (_pool: XoPool, { parentTask, ...opts }: RollingOpts) => {
      calls.push({ orchestrator, parentTask: parentTask?.id, ...opts })
    }
  const restApi = {
    getObject: () => pool,
    tasks: { create: (properties: unknown) => ({ id: 'task-1', properties, run: (fn: () => unknown) => fn() }) },
    xoApp: {
      finalizeRollingUpdate: record('finalizeRollingUpdate'),
      rollingPoolReboot: record('rollingPoolReboot'),
      rollingPoolUpdate: record('rollingPoolUpdate'),
    },
  } as unknown as RestApi
  // the injected services are not used by the rolling actions
  const controller = new PoolController(
    restApi,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    v2vService as never
  )
  return { calls, controller }
}

for (const [method, orchestrator] of [
  ['rollingReboot', 'rollingPoolReboot'],
  ['rollingUpdate', 'rollingPoolUpdate'],
] as const) {
  describe(`PoolController.${method}`, () => {
    it('forwards bypassBackupCheck from the body to the orchestrator', async () => {
      const { calls, controller } = createController()

      await controller[method]('pool-1', undefined, true)
      await controller[method]('pool-1', { bypassBackupCheck: true, shutdownPinnedVms: true }, true)

      // the REST task is the parent of the orchestrator's task tree
      assert.deepEqual(calls, [
        { orchestrator, parentTask: 'task-1' },
        { orchestrator, parentTask: 'task-1', bypassBackupCheck: true, shutdownPinnedVms: true },
      ])
    })
  })
}

describe('PoolController.finalizeRollingUpdate', () => {
  it('forwards force from the body to the orchestrator', async () => {
    const { calls, controller } = createController()

    await controller.finalizeRollingUpdate('pool-1', undefined, true)
    await controller.finalizeRollingUpdate('pool-1', { force: true }, true)

    assert.deepEqual(calls, [
      { orchestrator: 'finalizeRollingUpdate', parentTask: 'task-1' },
      { orchestrator: 'finalizeRollingUpdate', parentTask: 'task-1', force: true },
    ])
  })
})

describe('PoolController.importVmsFromVmware', () => {
  it('runs the import in a task of the pool, without the credentials of the source', async () => {
    const calls: unknown[] = []
    const plans = [{ id: 'vm-1' }, { id: 'vm-2' }]
    const v2vService = {
      prepareStart: async () => plans,
      start: async (task: { properties: unknown }, _body: unknown, startPlans: unknown) => {
        calls.push({ task: task.properties, plans: startPlans })
        return { 'vm-1': 'uuid-1', 'vm-2': 'uuid-2' }
      },
    }
    const { controller } = createController({ v2vService })
    const body = {
      connection: { host: 'vcenter', username: 'user', password: 'secret' },
      defaults: { sr: 'sr-1', network: 'net-1', template: 'tpl-1' },
      vms: [{ id: 'vm-1' }, { id: 'vm-2' }],
    }

    const result = await controller.importVmsFromVmware('pool-1', body, true)

    assert.deepEqual(result, { 'vm-1': 'uuid-1', 'vm-2': 'uuid-2' })
    assert.deepEqual(calls, [
      {
        task: {
          name: 'REST API: V2V migration',
          type: 'xo:rest-api:action',
          objectType: 'pool',
          objectId: 'pool-1',
          sourceVmIds: ['vm-1', 'vm-2'],
          params: { host: 'vcenter' },
        },
        plans,
      },
    ])
  })
})
