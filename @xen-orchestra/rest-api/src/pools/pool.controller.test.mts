import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { XoApp } from '@vates/types/xo-app'
import type { XoPool } from '@vates/types'

import { PoolController } from './pool.controller.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

const pool = { id: 'pool-1', name_label: 'pool 1' } as XoPool

type RollingOpts = NonNullable<Parameters<XoApp['rollingPoolUpdate']>[1]>

function createController() {
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
      rollingPoolReboot: record('rollingPoolReboot'),
      rollingPoolUpdate: record('rollingPoolUpdate'),
    },
  } as unknown as RestApi
  // the injected services are not used by the rolling actions
  const controller = new PoolController(restApi, {} as never, {} as never, {} as never, {} as never)
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
