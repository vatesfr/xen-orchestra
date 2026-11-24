import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { TaskController } from './task.controller.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

function createController() {
  const aborts: unknown[][] = []
  const actionTasks: Record<string, unknown>[] = []
  const restApi = {
    tasks: {
      // the task of the REST action, run at once
      create: (properties: Record<string, unknown>) => {
        actionTasks.push(properties)
        return { id: 'action-task', run: (fn: () => unknown) => Promise.resolve().then(fn) }
      },
      abort: async (...args: unknown[]) => {
        aborts.push(args)
      },
    },
  } as unknown as RestApi
  const controller = new TaskController(restApi)
  // the HTTP response helpers of tsoa are not wired outside of a request
  controller.setStatus = () => {}
  controller.setHeader = () => {}
  return { aborts, actionTasks, controller }
}

const taskId = '0mdd1basu'

describe('TaskController.abortTask', () => {
  it('skips the cleanup of the task when skipCleanup is set', async () => {
    const { aborts, actionTasks, controller } = createController()

    await controller.abortTask(taskId, { skipCleanup: true }, true)

    assert.equal(aborts.length, 1)
    const [id, reason, options] = aborts[0] as [string, unknown, { skipCleanup?: boolean }]
    assert.equal(id, taskId)
    assert.equal(reason, undefined, 'the abort reason is never set by the REST API')
    assert.equal(options.skipCleanup, true)
    assert.deepEqual(actionTasks[0].params, { skipCleanup: true }, 'the task of the action shows the skip')
  })

  it('does not skip the cleanup of the task by default', async () => {
    const { aborts, controller } = createController()

    await controller.abortTask(taskId, undefined, true)

    assert.equal(aborts.length, 1)
    const [id, , options] = aborts[0] as [string, unknown, { skipCleanup?: boolean } | undefined]
    assert.equal(id, taskId)
    assert.notEqual(options?.skipCleanup, true)
  })

  it('does not skip the cleanup of the task when skipCleanup is false', async () => {
    const { aborts, controller } = createController()

    await controller.abortTask(taskId, { skipCleanup: false }, true)

    const [, , options] = aborts[0] as [string, unknown, { skipCleanup?: boolean } | undefined]
    assert.notEqual(options?.skipCleanup, true)
  })
})
