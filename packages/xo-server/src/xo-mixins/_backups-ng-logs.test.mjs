import assert from 'assert/strict'
import test from 'node:test'
import { serializeError } from '@vates/task'

import { consolidateTaskStatusAndResult } from './backups-ng-logs.mjs'

const { describe, it } = test

describe('consolidateTaskStatusAndResult', function () {
  it('returns the task status unchanged when it has no subtasks', () => {
    const task = { status: 'success' }
    assert.equal(consolidateTaskStatusAndResult(task), 'success')
  })

  it('returns "failure" without inspecting subtasks when the task itself already failed', () => {
    const task = {
      status: 'failure',
      result: new Error('own failure'),
      tasks: [{ status: 'success' }],
    }
    assert.equal(consolidateTaskStatusAndResult(task), 'failure')
    // untouched: the task already carries its own result
    assert.equal(task.result.message, 'own failure')
  })

  it('turns a failure into "skipped" when the error matches a known skip reason', () => {
    const task = { status: 'failure', result: new Error('no disks found') }
    assert.equal(consolidateTaskStatusAndResult(task), 'skipped')
  })

  it("propagates a single failing subtask's serialized result to the parent, and still sorts subtasks", () => {
    const error = new Error('BodyTimeoutError')
    const task = {
      status: 'success',
      tasks: [
        { status: 'success', start: 2, end: 20 },
        { status: 'failure', result: error, start: 1, end: 10 },
      ],
    }
    assert.equal(consolidateTaskStatusAndResult(task), 'failure')
    // already serialized to a plain object: downstream serializers that don't special-case
    // Error/AggregateError (e.g. a plain JSON.stringify) would otherwise silently drop it
    assert.equal(task.result.message, 'BodyTimeoutError')
    assert.equal(task.result.name, 'Error')
    assert.deepEqual(
      task.tasks.map(({ start }) => start),
      [1, 2]
    )
  })

  it("bundles multiple failing subtasks' results into a serialized AggregateError", () => {
    const error1 = new Error('remote A timed out')
    const error2 = new Error('remote B timed out')
    const task = {
      status: 'success',
      tasks: [{ status: 'failure', result: error1 }, { status: 'success' }, { status: 'failure', result: error2 }],
    }
    assert.equal(consolidateTaskStatusAndResult(task), 'failure')
    assert.equal(task.result.name, 'AggregateError')
    assert.deepEqual(task.result.errors, [serializeError(error1), serializeError(error2)])
  })

  it("does not overwrite the parent's own result when subtasks also fail", () => {
    const ownError = new Error('own failure')
    const task = {
      status: 'success',
      result: ownError,
      tasks: [{ status: 'failure', result: new Error('subtask failure') }],
    }
    assert.equal(consolidateTaskStatusAndResult(task), 'failure')
    assert.equal(task.result, ownError)
  })

  it('ignores a failing subtask superseded by a successful retry with the same name/id', () => {
    const task = {
      status: 'success',
      warnings: [{ data: { isRetry: true } }],
      tasks: [
        { status: 'failure', result: new Error('first try failed'), properties: { name: 'export', id: 'sr:1' } },
        { status: 'success', properties: { name: 'export', id: 'sr:1' } },
      ],
    }
    assert.equal(consolidateTaskStatusAndResult(task), 'success')
    assert.equal(task.result, undefined)
  })

  it('still fails if the retried subtask does not match name/id of any successful sibling', () => {
    const task = {
      status: 'success',
      warnings: [{ data: { isRetry: true } }],
      tasks: [
        { status: 'failure', result: new Error('export failed'), properties: { name: 'export', id: 'sr:1' } },
        { status: 'success', properties: { name: 'export', id: 'sr:2' } },
      ],
    }
    assert.equal(consolidateTaskStatusAndResult(task), 'failure')
  })

  it('reports "skipped" when a subtask was skipped and none failed', () => {
    const task = {
      status: 'success',
      tasks: [{ status: 'success' }, { status: 'skipped' }],
    }
    assert.equal(consolidateTaskStatusAndResult(task), 'skipped')
  })

  it('sorts subtasks by end time, finished before unfinished', () => {
    const task = {
      status: 'success',
      tasks: [
        { status: 'success', start: 3, end: 30 },
        { status: 'pending', start: 1 },
        { status: 'success', start: 2, end: 10 },
      ],
    }
    consolidateTaskStatusAndResult(task)
    assert.deepEqual(
      task.tasks.map(({ start }) => start),
      [2, 3, 1]
    )
  })

  it('still sorts subtasks when the task itself already failed', () => {
    const task = {
      status: 'failure',
      result: new Error('own failure'),
      tasks: [
        { status: 'success', start: 3, end: 30 },
        { status: 'pending', start: 1 },
        { status: 'success', start: 2, end: 10 },
      ],
    }
    consolidateTaskStatusAndResult(task)
    assert.deepEqual(
      task.tasks.map(({ start }) => start),
      [2, 3, 1]
    )
  })
})
