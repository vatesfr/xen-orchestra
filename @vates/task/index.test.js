'use strict'

const assert = require('node:assert').strict
const { describe, it } = require('test')

const { Task } = require('./index.js')

const noop = Function.prototype

function assertEvent(task, expected, eventIndex = -1) {
  const logs = task.$events
  const actual = logs[eventIndex < 0 ? logs.length + eventIndex : eventIndex]

  assert.equal(typeof actual, 'object')
  assert.equal(typeof actual.id, 'string')
  assert.equal(typeof actual.timestamp, 'number')
  for (const keys of Object.keys(expected)) {
    assert.equal(actual[keys], expected[keys])
  }
}

// like new Task() but with a custom onProgress which adds event to task.$events
function createTask(opts) {
  const events = []
  const task = new Task({ ...opts, onProgress: events.push.bind(events) })
  task.$events = events
  return task
}

describe('Task', function () {
  describe('contructor', function () {
    it('data properties are passed to the start event', async function () {
      const data = { foo: 0, bar: 1 }
      const task = createTask({ data })
      await task.run(noop)
      assertEvent(task, { ...data, type: 'start' }, 0)
    })
  })

  it('subtasks events are passed to root task', async function () {
    const task = createTask()
    const result = {}

    await task.run(async () => {
      await new Task().run(() => result)
    })

    assert.equal(task.$events.length, 4)
    assertEvent(task, { type: 'start', parentId: task.id }, 1)
    assertEvent(task, { type: 'end', status: 'success', result }, 2)
  })

  describe('.abortSignal', function () {
    it('is undefined when run outside a task', function () {
      assert.equal(Task.abortSignal, undefined)
    })

    it('is the current abort signal when run inside a task', async function () {
      const task = createTask()
      await task.run(() => {
        const { abortSignal } = Task
        assert.equal(abortSignal.aborted, false)
        task.abort()
        assert.equal(abortSignal.aborted, true)
      })
    })
  })

  describe('.abort()', function () {
    it('aborts if the task throws fails with the abort reason', async function () {
      const task = createTask()
      const reason = {}

      await task
        .run(() => {
          task.abort(reason)

          Task.abortSignal.throwIfAborted()
        })
        .catch(noop)

      assert.equal(task.status, 'aborted')

      assert.equal(task.$events.length, 2)
      assertEvent(task, { type: 'start' }, 0)
      assertEvent(task, { type: 'end', status: 'aborted', result: reason }, 1)
    })

    it('does not abort if the task fails without the abort reason', async function () {
      const task = createTask()
      const result = new Error()

      await task
        .run(() => {
          task.abort({})

          throw result
        })
        .catch(noop)

      assert.equal(task.status, 'failure')

      assert.equal(task.$events.length, 2)
      assertEvent(task, { type: 'start' }, 0)
      assertEvent(task, { type: 'end', status: 'failure', result }, 1)
    })

    it('does not abort if the task succeed', async function () {
      const task = createTask()
      const result = {}

      await task
        .run(() => {
          task.abort({})

          return result
        })
        .catch(noop)

      assert.equal(task.status, 'success')

      assert.equal(task.$events.length, 2)
      assertEvent(task, { type: 'start' }, 0)
      assertEvent(task, { type: 'end', status: 'success', result }, 1)
    })

    it('aborts before task is running', function () {
      const task = createTask()
      const reason = {}

      task.abort(reason)

      assert.equal(task.status, 'aborted')

      assert.equal(task.$events.length, 2)
      assertEvent(task, { type: 'start' }, 0)
      assertEvent(task, { type: 'end', status: 'aborted', result: reason }, 1)
    })
  })

  describe('.info()', function () {
    it('does nothing when run outside a task', function () {
      Task.info('foo')
    })

    it('emits an info message when run inside a task', async function () {
      const task = createTask()
      await task.run(() => {
        Task.info('foo')
        assertEvent(task, {
          data: undefined,
          message: 'foo',
          type: 'info',
        })
      })
    })
  })

  describe('.set()', function () {
    it('does nothing when run outside a task', function () {
      Task.set('progress', 10)
    })

    it('emits an info message when run inside a task', async function () {
      const task = createTask()
      await task.run(() => {
        Task.set('progress', 10)
        assertEvent(task, {
          name: 'progress',
          type: 'property',
          value: 10,
        })
      })
    })
  })

  describe('.warning()', function () {
    it('does nothing when run outside a task', function () {
      Task.warning('foo')
    })

    it('emits an warning message when run inside a task', async function () {
      const task = createTask()
      await task.run(() => {
        Task.warning('foo')
        assertEvent(task, {
          data: undefined,
          message: 'foo',
          type: 'warning',
        })
      })
    })
  })

  describe('#id', function () {
    it('can be set', function () {
      const task = createTask()
      task.id = 'foo'
      assert.equal(task.id, 'foo')
    })

    it('cannot be set more than once', function () {
      const task = createTask()
      task.id = 'foo'

      assert.throws(() => {
        task.id = 'bar'
      }, TypeError)
    })

    it('is randomly generated if not set', function () {
      assert.notEqual(createTask().id, createTask().id)
    })

    it('cannot be set after being observed', function () {
      const task = createTask()
      noop(task.id)

      assert.throws(() => {
        task.id = 'bar'
      }, TypeError)
    })
  })

  describe('#status', function () {
    it('starts as pending', function () {
      assert.equal(createTask().status, 'pending')
    })

    it('changes to success when finish without error', async function () {
      const task = createTask()
      await task.run(noop)
      assert.equal(task.status, 'success')
    })

    it('changes to failure when finish with error', async function () {
      const task = createTask()
      await task
        .run(() => {
          throw Error()
        })
        .catch(noop)
      assert.equal(task.status, 'failure')
    })

    it('changes to aborted after run is complete', async function () {
      const task = createTask()
      await task
        .run(() => {
          task.abort()
          assert.equal(task.status, 'pending')
          Task.abortSignal.throwIfAborted()
        })
        .catch(noop)
      assert.equal(task.status, 'aborted')
    })

    it('changes to aborted if aborted when not running', async function () {
      const task = createTask()
      task.abort()
      assert.equal(task.status, 'aborted')
    })
  })

  function makeRunTests(run) {
    it('starts the task', async function () {
      const task = createTask()
      await run(task, () => {
        assertEvent(task, { type: 'start' })
      })
    })

    it('finishes the task on success', async function () {
      const task = createTask()
      await run(task, () => 'foo')
      assert.equal(task.status, 'success')
      assertEvent(task, {
        status: 'success',
        result: 'foo',
        type: 'end',
      })
    })

    it('fails the task on error', async function () {
      const task = createTask()
      const e = new Error()
      await run(task, () => {
        throw e
      }).catch(noop)

      assert.equal(task.status, 'failure')
      assertEvent(task, {
        status: 'failure',
        result: e,
        type: 'end',
      })
    })
  }
  describe('.run', function () {
    makeRunTests((task, fn) => task.run(fn))
  })
  describe('.wrap', function () {
    makeRunTests((task, fn) => task.wrap(fn)())
  })

  function makeRunInsideTests(run) {
    it('starts the task', async function () {
      const task = createTask()
      await run(task, () => {
        assertEvent(task, { type: 'start' })
      })
    })

    it('does not finish the task on success', async function () {
      const task = createTask()
      await run(task, () => 'foo')
      assert.equal(task.status, 'pending')
    })

    it('fails the task on error', async function () {
      const task = createTask()
      const e = new Error()
      await run(task, () => {
        throw e
      }).catch(noop)

      assert.equal(task.status, 'failure')
      assertEvent(task, {
        status: 'failure',
        result: e,
        type: 'end',
      })
    })
  }
  describe('.runInside', function () {
    makeRunInsideTests((task, fn) => task.runInside(fn))
  })
  describe('.wrapInside', function () {
    makeRunInsideTests((task, fn) => task.wrapInside(fn)())
  })
})
