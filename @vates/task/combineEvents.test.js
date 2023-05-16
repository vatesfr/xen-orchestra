'use strict'

const assert = require('node:assert').strict
const { describe, it } = require('test')

const { makeOnProgress } = require('./combineEvents.js')
const { Task } = require('./index.js')

describe('makeOnProgress()', function () {
  it('works', async function () {
    const events = []
    let log
    const task = new Task({
      data: { name: 'task' },
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

    await task.run(async () => {
      assert.equal(events[0], 'onRootTaskStart')
      assert.equal(events[1], 'onTaskUpdate')
      assert.equal(log.name, 'task')

      Task.set('progress', 0)
      assert.equal(events[2], 'onTaskUpdate')
      assert.equal(log.properties.progress, 0)

      Task.info('foo', {})
      assert.equal(events[3], 'onTaskUpdate')
      assert.deepEqual(log.infos, [{ data: {}, message: 'foo' }])

      await Task.run({ data: { name: 'subtask' } }, () => {
        assert.equal(events[4], 'onTaskUpdate')
        assert.equal(log.tasks[0].name, 'subtask')

        Task.warning('bar', {})
        assert.equal(events[5], 'onTaskUpdate')
        assert.deepEqual(log.tasks[0].warnings, [{ data: {}, message: 'bar' }])
      })
      assert.equal(events[6], 'onTaskUpdate')
      assert.equal(log.tasks[0].status, 'success')

      Task.set('progress', 100)
      assert.equal(events[7], 'onTaskUpdate')
      assert.equal(log.properties.progress, 100)
    })
    assert.equal(events[8], 'onRootTaskEnd')
    assert.equal(events[9], 'onTaskUpdate')
    assert.equal(log.status, 'success')
  })
})
