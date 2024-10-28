'use strict'

const assert = require('node:assert').strict
const { describe, it } = require('node:test')

const { makeOnProgress } = require('./combineEvents.js')
const { Task } = require('./index.js')

const noop = Function.prototype

function assertEvent(task, expected, eventIndex = -1) {
  const logs = task.$events
  const actual = logs[eventIndex < 0 ? logs.length + eventIndex : eventIndex]

  assert.equal(typeof actual, 'object')
  assert.equal(typeof actual.id, 'string')
  assert.equal(typeof actual.timestamp, 'number')
  for (const keys of Object.keys(expected)) {
    assert.deepEqual(actual[keys], expected[keys])
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
      const properties = { foo: 0, bar: 1 }
      const task = createTask({ properties })
      await task.run(noop)
      assertEvent(task, { type: 'start', properties }, 0)
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

      assert.equal(task.status, 'failure')

      assert.equal(task.$events.length, 3)
      assertEvent(task, { type: 'start' }, 0)
      assertEvent(task, { type: 'abortionRequested', reason }, 1)
      assertEvent(task, { type: 'end', status: 'failure', result: reason }, 2)
    })

    it('does not abort if the task fails without the abort reason', async function () {
      const task = createTask()
      const reason = {}
      const result = new Error()

      await task
        .run(() => {
          task.abort(reason)

          throw result
        })
        .catch(noop)

      assert.equal(task.status, 'failure')

      assert.equal(task.$events.length, 3)
      assertEvent(task, { type: 'start' }, 0)
      assertEvent(task, { type: 'abortionRequested', reason }, 1)
      assertEvent(task, { type: 'end', status: 'failure', result }, 2)
    })

    it('does not abort if the task succeed', async function () {
      const task = createTask()
      const reason = {}
      const result = {}

      await task
        .run(() => {
          task.abort(reason)

          return result
        })
        .catch(noop)

      assert.equal(task.status, 'success')

      assert.equal(task.$events.length, 3)
      assertEvent(task, { type: 'start' }, 0)
      assertEvent(task, { type: 'abortionRequested', reason }, 1)
      assertEvent(task, { type: 'end', status: 'success', result }, 2)
    })

    it('aborts before task is running', function () {
      const task = createTask()
      const reason = {}

      task.abort(reason)

      assert.equal(task.status, 'failure')

      assert.equal(task.$events.length, 3)
      assertEvent(task, { type: 'start' }, 0)
      assertEvent(task, { type: 'abortionRequested', reason }, 1)
      assertEvent(task, { type: 'end', status: 'failure', result: reason }, 2)
    })
  })

  describe('#failure()', function () {
    const error = new Error()

    it('throws if the task has not started yet', function () {
      const task = createTask()

      assert.throws(() => task.failure(error), { message: 'task has not started yet' })
    })

    it('throws if the task has already finished', function () {
      const task = createTask()
      task.start()
      task.success()

      assert.throws(() => task.failure(error), { code: 'ERR_ASSERTION' })
    })

    it('finishes the task and mark it as failed', function () {
      const task = createTask()
      task.start()
      task.failure(error)

      assertEvent(task, {
        status: 'failure',
        result: error,
        type: 'end',
      })
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

  describe('.run()', function () {
    function fn(...args) {
      Task.set('baz', 'qux')

      return [this, ...args]
    }
    const obj = { fn }

    it('accepts optional options', async function () {
      assert.deepEqual(
        await Task.run(
          {
            properties: { foo: 'bar' },
            onProgress: makeOnProgress({
              onRootTaskEnd(log) {
                assert.deepEqual(log.properties, { __proto__: null, foo: 'bar', baz: 'qux' })
              },
            }),
          },
          fn
        ),
        [undefined]
      )
    })

    it('accepts optional arguments', async function () {
      assert.deepEqual(await Task.run(fn, 'foo', 'bar'), [undefined, 'foo', 'bar'])
    })

    it('accepts optional context', async function () {
      assert.deepEqual(await Task.run.call('foo', fn), ['foo'])
    })

    it('accepts a method name instead of a function', async function () {
      assert.deepEqual(await Task.run.call(obj, 'fn'), [obj])
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

  describe('#set()', function () {
    const name = 'progress'
    const value = 10

    it('throws when the task is not started', function () {
      const task = createTask()
      assert.throws(() => task.set(name, value), { message: 'task has not started yet' })
    })

    it(`emits an property message`, async function () {
      const task = createTask()
      await task.run(async () => {
        await Task.run(() => {
          task.set(name, value)

          assertEvent(task, {
            name,
            type: 'property',
            value,
          })
        })
      })
    })
  })

  describe('#start', function () {
    it('starts the task', function () {
      const task = createTask()
      task.start()

      assertEvent(task, { type: 'start' })
    })

    it('throws when the task has already started', function () {
      const task = createTask()
      task.start()

      assert.throws(() => task.start(), { message: 'task has already started' })
    })
  })

  describe('#success()', function () {
    const result = {}

    it('throws if the task has not started yet', function () {
      const task = createTask()

      assert.throws(() => task.success(result), { message: 'task has not started yet' })
    })

    it('throws if the task has already finished', function () {
      const task = createTask()
      task.start()
      task.success()

      assert.throws(() => task.success(result), { code: 'ERR_ASSERTION' })
    })

    it('finishes the task and mark it as successful', function () {
      const task = createTask()
      task.start()
      task.success(result)

      assertEvent(task, {
        status: 'success',
        result,
        type: 'end',
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

  for (const type of ['info', 'warning']) {
    describe(`#${type}()`, function () {
      it('throws when the task is not started', function () {
        const task = createTask()
        assert.throws(() => task[type]('foo'), { message: 'task has not started yet' })
      })

      it(`emits an ${type} message`, async function () {
        const task = createTask()
        await task.run(async () => {
          await Task.run(() => {
            task[type]('foo')

            assertEvent(task, {
              data: undefined,
              message: 'foo',
              type,
            })
          })
        })
      })
    })
  }

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

    it('changes to failure if aborted  after run is complete', async function () {
      const task = createTask()
      await task
        .run(() => {
          task.abort()
          assert.equal(task.status, 'pending')
          Task.abortSignal.throwIfAborted()
        })
        .catch(noop)
      assert.equal(task.status, 'failure')
    })

    it('changes to failure if aborted when not running', function () {
      const task = createTask()
      task.abort()
      assert.equal(task.status, 'failure')
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
