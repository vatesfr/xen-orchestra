'use strict'

const assert = require('node:assert').strict
const { describe, it } = require('node:test')

const { makeOnProgress } = require('./combineEvents.js')
const { Task } = require('./index.js')

describe('makeOnProgress()', function () {
  it('works', async function () {
    const events = []
    let log
    const task = new Task({
      properties: { name: 'task' },
      onProgress: makeOnProgress({
        onRootTaskStart(log_) {
          assert.equal(log, undefined)
          log = log_
          events.push('onRootTaskStart')
        },
        onRootTaskEnd(log_) {
          assert.equal(log_, log)
          events.push('onRootTaskEnd')
        },

        onTaskUpdate(log_) {
          assert.equal(log_.$root, log)
          events.push('onTaskUpdate')
        },
      }),
    })

    assert.equal(events.length, 0)

    let i = 0

    await task.run(async () => {
      assert.equal(events[i++], 'onRootTaskStart')
      assert.equal(events[i++], 'onTaskUpdate')
      assert.equal(log.id, task.id)
      assert.equal(log.properties.name, 'task')
      assert(Math.abs(log.start - Date.now()) < 10)

      Task.set('name', 'new name')
      assert.equal(events[i++], 'onTaskUpdate')
      assert.equal(log.properties.name, 'new name')

      Task.set('progress', 0)
      assert.equal(events[i++], 'onTaskUpdate')
      assert.equal(log.properties.progress, 0)

      Task.info('foo', {})
      assert.equal(events[i++], 'onTaskUpdate')
      assert.deepEqual(log.infos, [{ data: {}, message: 'foo' }])

      const subtask = new Task({ properties: { name: 'subtask' } })
      await subtask.run(() => {
        assert.equal(events[i++], 'onTaskUpdate')
        assert.equal(log.tasks[0].properties.name, 'subtask')

        Task.warning('bar', {})
        assert.equal(events[i++], 'onTaskUpdate')
        assert.deepEqual(log.tasks[0].warnings, [{ data: {}, message: 'bar' }])

        subtask.abort()
        assert.equal(events[i++], 'onTaskUpdate')
        assert(Math.abs(log.tasks[0].abortionRequestedAt - Date.now()) < 10)
      })
      assert.equal(events[i++], 'onTaskUpdate')
      assert.equal(log.tasks[0].status, 'success')

      Task.set('progress', 100)
      assert.equal(events[i++], 'onTaskUpdate')
      assert.equal(log.properties.progress, 100)
    })
    assert.equal(events[i++], 'onRootTaskEnd')
    assert.equal(events[i++], 'onTaskUpdate')
    assert(Math.abs(log.end - Date.now()) < 10)
    assert.equal(log.status, 'success')
  })
})
