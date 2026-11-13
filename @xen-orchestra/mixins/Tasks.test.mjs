import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'

import Tasks from './Tasks.mjs'
import { Task } from '@vates/task'
import { forbiddenOperation, noSuchObject } from 'xo-common/api-errors.js'

function makeApp() {
  const listeners = {}
  const hooks = {
    on(name, fn) {
      listeners[name] = fn
      return hooks
    },
  }

  const data = new Map()
  const puts = []
  const pending = []
  const failing = new Set()
  const store = {
    async get(id) {
      if (!data.has(id)) {
        throw Object.assign(new Error(`no such task ${id}`), { type: 'NotFoundError' })
      }
      return structuredClone(data.get(id))
    },
    async put(id, value) {
      puts.push(id)
      const snapshot = structuredClone(value)
      if (pending.length !== 0 && pending[0].id === id) {
        await pending.shift().promise
      }
      if (failing.delete(id)) {
        throw new Error(`write of ${id} failed`)
      }
      data.set(id, snapshot)
    },
    async del(id, cb) {
      data.delete(id)
      cb?.()
    },
    async *iterator() {
      yield* [...data].map(([key, value]) => [key, structuredClone(value)])
    },
    close() {},
  }

  const app = {
    hooks,
    config: { getOptional: () => undefined, getOptionalDuration: () => undefined },
    getStore: async () => store,
  }

  return {
    app,
    data,
    puts,
    // the next put of `id` fails
    failPut(id) {
      failing.add(id)
    },
    holdPut(id) {
      let release
      const promise = new Promise(resolve => (release = resolve))
      pending.push({ id, promise })
      return () => release()
    },
    // runs the `start` hook, which loads the store
    async start() {
      await listeners.start()
    },
  }
}

const flush = () => sleep(10)

describe('Tasks', () => {
  it('persists an internal task run with success', async () => {
    const fake = makeApp()
    const tasks = new Tasks(fake.app)
    await fake.start()

    const task = tasks.create({ name: 'smoke test' })
    await task.run(() => 'ok')
    await flush()

    const log = fake.data.get(task.id)
    assert.equal(log.status, 'success')
    assert.equal(log.result, 'ok')
    assert.notEqual(log.end, undefined)
  })

  it('persists the final state of a failed external root task whose end hook throws (B2)', async () => {
    const fake = makeApp()
    const tasks = new Tasks(fake.app)
    await fake.start()

    const onRootTaskEnd = log => {
      if (log.status === 'failure') {
        throw log.result ?? new Error('backup task failed with undefined error')
      }
    }
    const updates = []
    const onTaskUpdate = (log, event) => updates.push(`${event.type}:${log.status}`)
    const onLogFct = tasks.createExternalProgressHandler({ onRootTaskEnd, onTaskUpdate })

    const id = 'external-root'
    const timestamp = Date.now()
    onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
    await flush()

    assert.throws(
      () => onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'failure', result: new Error('no remote') }),
      /no remote/
    )
    await flush()

    const log = fake.data.get(id)
    assert.equal(log.status, 'failure')
    assert.notEqual(log.end, undefined)
    assert.deepEqual(updates, ['start:pending', 'end:failure'])
  })

  describe('watch and live logs (2.1, 2.2)', () => {
    const finalState = (tasks, id) =>
      new Promise((resolve, reject) => {
        tasks
          .watch(id, log => {
            if (log.status !== 'pending') {
              resolve(log)
            }
          })
          .catch(reject)
      })

    const recordStates = async (tasks, id) => {
      const states = []
      await tasks.watch(id, log => states.push(log.status))
      await flush()
      return states
    }

    it('watches an internal task created but not started', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const task = tasks.create({ name: 'not started yet' })
      const pFinal = finalState(tasks, task.id)
      await task.run(() => 'ok')

      assert.equal((await pFinal).status, 'success')
    })

    it('watches an external task right after its first event, before it is persisted', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const id = 'ext-1'
      const onLogFct = tasks.createExternalProgressHandler()
      const timestamp = Date.now()
      onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })

      const pFinal = finalState(tasks, id) // no flush: the start is not persisted yet
      onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })

      assert.equal((await pFinal).status, 'success')
    })

    it('watches a running external task until it ends', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const id = 'ext-2'
      const onLogFct = tasks.createExternalProgressHandler()
      const timestamp = Date.now()
      onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
      await flush()

      const pFinal = finalState(tasks, id)
      await flush()
      onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })

      assert.equal((await pFinal).status, 'success')
    })

    it('answers at once with the final state of an internal task whose final write is held', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const task = tasks.create({ name: 'held write' })
      const release = fake.holdPut(task.id)
      await task.run(() => 'ok')
      await flush()

      assert.equal(fake.data.get(task.id), undefined)
      assert.equal((await finalState(tasks, task.id)).status, 'success')

      release()
      await flush()
      assert.equal(fake.data.get(task.id).status, 'success')
    })

    it('answers at once with the final state of an external task whose final write is held', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const id = 'ext-held'
      const releaseStart = fake.holdPut(id)
      const onLogFct = tasks.createExternalProgressHandler()
      const timestamp = Date.now()
      onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
      await flush()

      onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })
      assert.equal((await finalState(tasks, id)).status, 'success')

      releaseStart()
      await flush()
      assert.equal(fake.data.get(id).status, 'success')
    })

    it('keeps a live task answerable when an end arrives while an earlier state is being written (B1)', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const id = 'ext-b1'
      const releaseStart = fake.holdPut(id) // 1st write: the pending start state
      const releaseFinal = fake.holdPut(id) // 2nd write: the final state
      const onLogFct = tasks.createExternalProgressHandler()
      const timestamp = Date.now()
      onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
      await flush()

      onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })
      await flush()

      releaseStart()
      await flush()

      assert.equal(fake.data.get(id).status, 'pending')
      assert.equal((await finalState(tasks, id)).status, 'success')

      releaseFinal()
      await flush()
      assert.equal(fake.data.get(id).status, 'success')
    })

    it('answers a finished task once from the store', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const task = tasks.create({ name: 'finished' })
      await task.run(() => 'ok')
      await flush()

      assert.deepEqual(await recordStates(tasks, task.id), ['success'])
    })

    const waitLikeRestApi = async (tasks, id) => {
      let resolveWait
      const promise = new Promise(resolve => (resolveWait = resolve))
      const stopWatch = await tasks.watch(id, task => {
        if (task.status !== 'pending') {
          stopWatch()
          resolveWait(task)
        }
      })
      return promise
    }

    it('REST-style wait resolves on a running external task', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const id = 'ext-rest-1'
      const onLogFct = tasks.createExternalProgressHandler()
      const timestamp = Date.now()
      onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
      await flush()

      const pWait = waitLikeRestApi(tasks, id)
      await flush()
      onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })

      assert.equal((await pWait).status, 'success')
    })

    it('REST-style wait resolves at once on an external task that is already final', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const id = 'ext-rest-2'
      const onLogFct = tasks.createExternalProgressHandler()
      const timestamp = Date.now()
      onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
      onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })

      assert.equal((await waitLikeRestApi(tasks, id)).status, 'success')
    })

    it('keeps persisting and notifying after a watcher throws', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const broken = tasks.create({ name: 'broken watcher' })
      tasks.on(broken.id, () => {
        throw new Error('watcher boom')
      })
      await broken.run(() => 'ok')
      await flush()
      assert.equal(fake.data.get(broken.id).status, 'success')

      const other = tasks.create({ name: 'later task' })
      const pOther = finalState(tasks, other.id)
      await other.run(() => 'ok')
      assert.equal((await pOther).status, 'success')
      await flush()
      assert.equal(fake.data.get(other.id).status, 'success')
    })

    it('notifies watchers of a clear-on-success task before deleting its log', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const task = tasks.create({ name: 'clear on success' }, { clearLogOnSuccess: true })
      const pFinal = finalState(tasks, task.id)
      await task.run(() => 'ok')

      assert.equal((await pFinal).status, 'success')
      await flush()
      assert.equal(fake.data.has(task.id), false)
    })

    it('keeps the log of a failed clear-on-success task and notifies its failure', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const task = tasks.create({ name: 'clear on success, fails' }, { clearLogOnSuccess: true })
      const pFinal = finalState(tasks, task.id)
      await assert.rejects(
        task.run(() => Promise.reject(new Error('boom'))),
        /boom/
      )

      assert.equal((await pFinal).status, 'failure')
      await flush()
      assert.equal(fake.data.get(task.id).status, 'failure')
    })

    it('calls the hooks of a handler without options as before, for a successful task', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const calls = []
      const onLogFct = tasks.createExternalProgressHandler({
        onRootTaskStart: (log, event) => calls.push(['start', log.id, event.type]),
        onRootTaskEnd: (log, event) => calls.push(['end', log.id, event.type, log.status]),
        onTaskUpdate: (log, event) => calls.push(['update', event.type]),
      })

      const id = 'ext-hooks'
      const timestamp = Date.now()
      onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
      onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })
      await flush()

      assert.deepEqual(calls, [
        ['start', id, 'start'],
        ['update', 'start'],
        ['end', id, 'end', 'success'],
        ['update', 'end'],
      ])
      assert.equal(fake.data.get(id).status, 'success')
    })

    it('calls the abort option of a running external task with the reason', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const reasons = []
      const onLogFct = tasks.createExternalProgressHandler({ abort: reason => reasons.push(reason) })

      const id = 'ext-abort'
      const timestamp = Date.now()
      onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })

      await tasks.abort(id, 'user request')
      assert.deepEqual(reasons, ['user request'])
    })

    it('does not call the abort option after the external task ended', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const calls = []
      const onLogFct = tasks.createExternalProgressHandler({ abort: () => calls.push('abort') })

      const id = 'ext-abort-after-end'
      const timestamp = Date.now()
      onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
      onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })

      await assert.rejects(tasks.abort(id, 'late'))
      assert.deepEqual(calls, [])
    })

    describe('handler.end() (5.1)', () => {
      const startRootAndChild = (onLogFct, id, timestamp) => {
        onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
        onLogFct({
          type: 'start',
          id: `${id}-child`,
          parentId: id,
          timestamp: timestamp + 1,
          properties: { name: 'vm' },
        })
      }

      it('ends open subtasks and the root as interrupted with the reason, and notifies watchers', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const onLogFct = tasks.createExternalProgressHandler()
        const timestamp = Date.now()
        startRootAndChild(onLogFct, 'root-end', timestamp)

        const pFinal = finalState(tasks, 'root-end')
        onLogFct.end(undefined, 'source lost')

        const final = await pFinal
        assert.equal(final.status, 'interrupted')
        assert.equal(final.result, 'source lost')
        assert.notEqual(final.end, undefined)

        await flush()
        const stored = fake.data.get('root-end')
        assert.equal(stored.status, 'interrupted')
        assert.equal(stored.tasks[0].status, 'interrupted')
        assert.equal(stored.tasks[0].result, 'source lost')
      })

      it('persists the status left by the caller hooks on end, not the requested one', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const onLogFct = tasks.createExternalProgressHandler({
          onTaskUpdate: (log, event) => {
            if (event.type === 'end' && log.$root === log) {
              log.status = 'failure'
            }
          },
        })
        const timestamp = Date.now()
        onLogFct({ type: 'start', id: 'root-rewrite', timestamp, properties: { name: 'backup run' } })
        onLogFct.end('interrupted', 'source lost')
        await flush()

        assert.equal(fake.data.get('root-rewrite').status, 'failure')
      })

      it('changes nothing when called before the start or after the end', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const onLogFct = tasks.createExternalProgressHandler()
        onLogFct.end()

        const id = 'root-noop'
        const timestamp = Date.now()
        onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
        onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })
        onLogFct.end()
        await flush()

        assert.equal(fake.data.get(id).status, 'success')
        assert.equal(fake.data.get(id).result, 'done')
      })

      it('drops events sent after end() without throwing', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const onLogFct = tasks.createExternalProgressHandler()
        const id = 'root-after'
        const timestamp = Date.now()
        onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
        onLogFct.end(undefined, 'source lost')

        assert.doesNotThrow(() => onLogFct({ type: 'info', id, timestamp: timestamp + 2, message: 'late' }))
        await flush()
        assert.equal(fake.data.get(id).status, 'interrupted')
        assert.equal(fake.data.get(id).infos, undefined)
      })

      it('no longer calls the abort option once ended with end()', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const calls = []
        const onLogFct = tasks.createExternalProgressHandler({ abort: () => calls.push('abort') })
        const id = 'root-abort-end'
        onLogFct({ type: 'start', id, timestamp: Date.now(), properties: { name: 'backup run' } })
        onLogFct.end(undefined, 'source lost')

        await assert.rejects(tasks.abort(id, 'late'))
        assert.deepEqual(calls, [])
      })

      it('does not track a subtask start rejected for an unknown parent', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const onLogFct = tasks.createExternalProgressHandler()
        const id = 'root-bad-child'
        const timestamp = Date.now()
        onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
        assert.throws(() =>
          onLogFct({ type: 'start', id: 'orphan', parentId: 'missing', timestamp: timestamp + 1, properties: {} })
        )

        assert.doesNotThrow(() => onLogFct.end(undefined, 'source lost'))
        await flush()
        assert.equal(fake.data.get(id).status, 'interrupted')
      })

      it('ends every open task even if the root end hook throws, then rethrows the error', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const onLogFct = tasks.createExternalProgressHandler({
          onRootTaskEnd: () => {
            throw new Error('hook boom')
          },
        })
        const timestamp = Date.now()
        startRootAndChild(onLogFct, 'root-hook', timestamp)

        assert.throws(() => onLogFct.end(undefined, 'source lost'), /hook boom/)
        await flush()

        const stored = fake.data.get('root-hook')
        assert.equal(stored.status, 'interrupted')
        assert.equal(stored.tasks[0].status, 'interrupted')
      })
    })

    describe('real caller shapes of a failing root task (5.2)', () => {
      const failingRootEnd = log => {
        if (log.status === 'failure') {
          throw new Error('hook boom')
        }
      }

      it('in-process Task.run with onProgress: ends failure, watcher resolves, run rejects', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const ids = []
        const onLogFct = tasks.createExternalProgressHandler({
          onRootTaskStart: log => ids.push(log.id),
          onRootTaskEnd: failingRootEnd,
        })

        await assert.rejects(
          Task.run({ properties: { name: 'backup run' }, onProgress: onLogFct }, () =>
            Promise.reject(new Error('job failed'))
          ),
          /job failed|hook boom/
        )
        const [id] = ids
        await flush()

        assert.equal(fake.data.get(id).status, 'failure')
        assert.equal((await finalState(tasks, id)).status, 'failure')
      })

      it('proxy-like for-await feed: ends failure, watcher resolves, loop rejects with the hook error', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const id = 'proxy-root'
        const timestamp = Date.now()
        async function* logsStream() {
          yield { type: 'start', id, timestamp, properties: { name: 'backup run' } }
          await sleep(10) // a stream delivers the end later
          yield { type: 'end', id, timestamp: timestamp + 1, status: 'failure', result: new Error('job failed') }
        }

        const onLogFct = tasks.createExternalProgressHandler({ onRootTaskEnd: failingRootEnd })
        let pFinal
        await assert.rejects(
          (async () => {
            for await (const log of logsStream()) {
              onLogFct(log)
              if (log.type === 'start') {
                pFinal = finalState(tasks, id)
              }
            }
          })(),
          /hook boom/
        )

        assert.equal((await pFinal).status, 'failure')
        await flush()
        assert.equal(fake.data.get(id).status, 'failure')
      })

      it('worker-like feed that logs the errors of the handler: ends failure, watcher resolves, no throw', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const id = 'worker-root'
        const timestamp = Date.now()
        const errors = []
        const onLogFct = tasks.createExternalProgressHandler({ onRootTaskEnd: failingRootEnd })
        const feedWorkerEvent = event => {
          try {
            onLogFct(event)
          } catch (error) {
            errors.push(error)
          }
        }

        feedWorkerEvent({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
        await flush()
        const pFinal = finalState(tasks, id)
        feedWorkerEvent({
          type: 'end',
          id,
          timestamp: timestamp + 1,
          status: 'failure',
          result: new Error('job failed'),
        })

        assert.equal((await pFinal).status, 'failure')
        assert.equal(errors.length, 1)
        assert.match(errors[0].message, /hook boom/)
        await flush()
        assert.equal(fake.data.get(id).status, 'failure')
      })
    })

    describe('code review fixes', () => {
      it('notifies every watcher of a task even if an earlier listener throws (3)', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const task = tasks.create({ name: 'throwing first listener' })
        tasks.on(task.id, () => {
          throw new Error('first listener boom')
        })
        const pFinal = finalState(tasks, task.id)
        await task.run(() => 'ok')

        const result = await Promise.race([pFinal, sleep(200).then(() => 'timeout')])
        assert.equal(result.status, 'success')
      })

      it('REST-style wait resolves when the final state is flushed before its await returns (8)', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const id = 'ext-tdz'
        const onLogFct = tasks.createExternalProgressHandler()
        const timestamp = Date.now()
        onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
        await flush()

        // from a macrotask (not a promise continuation), the watch registers while the task is pending, then the end
        // is buffered at once: the flush (nextTick) runs before the await of the watcher returns
        const { p: pWait } = await new Promise(resolve =>
          setImmediate(() => {
            const p = waitLikeRestApi(tasks, id)
            onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })
            resolve({ p })
          })
        )

        const result = await Promise.race([pWait, sleep(200).then(() => 'timeout')])
        assert.equal(result.status, 'success')
      })

      it('throws the root end error, not the update hook error, and not again on a later event (4)', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const onLogFct = tasks.createExternalProgressHandler({
          onRootTaskEnd: () => {
            throw new Error('root end boom')
          },
          onTaskUpdate: (log, event) => {
            if (event.type === 'end' && log.$root === log) {
              throw new Error('update boom')
            }
          },
        })
        const id = 'root-both-throw'
        const timestamp = Date.now()
        onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
        onLogFct({ type: 'start', id: `${id}-child`, parentId: id, timestamp, properties: { name: 'vm' } })

        assert.throws(
          () => onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'failure', result: 'x' }),
          /root end boom/
        )
        assert.doesNotThrow(() =>
          onLogFct({ type: 'end', id: `${id}-child`, timestamp: timestamp + 2, status: 'success' })
        )
      })

      it('ignores the end of a subtask whose start was rejected for an unknown parent (7)', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const onLogFct = tasks.createExternalProgressHandler()
        const id = 'root-orphan-end'
        const timestamp = Date.now()
        onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
        assert.throws(() =>
          onLogFct({ type: 'start', id: 'orphan', parentId: 'missing', timestamp: timestamp + 1, properties: {} })
        )

        assert.doesNotThrow(() => onLogFct({ type: 'end', id: 'orphan', timestamp: timestamp + 2, status: 'success' }))
        await flush()
        assert.equal(fake.data.get(id).status, 'pending')
      })

      it('persists an event buffered while a flush ends, whatever the timing', async () => {
        // the end is fed after a varying number of microtasks once the first write returned: one of them falls
        // between the last check of the buffer and the end of the flush
        for (let depth = 0; depth < 30; depth++) {
          const fake = makeApp()
          const tasks = new Tasks(fake.app)
          await fake.start()

          const id = `ext-gap-${depth}`
          const onLogFct = tasks.createExternalProgressHandler()
          const release = fake.holdPut(id)
          const timestamp = Date.now()
          onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
          await flush()

          release()
          for (let i = 0; i < depth; i++) {
            await null
          }
          onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })
          await flush()

          assert.equal(fake.data.get(id)?.status, 'success', `end fed after ${depth} microtasks`)
        }
      })

      it('get() answers a live task before its first write', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const id = 'ext-not-written'
        const onLogFct = tasks.createExternalProgressHandler()
        const release = fake.holdPut(id)
        onLogFct({ type: 'start', id, timestamp: Date.now(), properties: { name: 'backup run' } })
        await flush()
        assert.equal(fake.data.has(id), false)

        const log = await tasks.get(id)
        assert.equal(log.status, 'pending')
        assert.equal(log.properties.name, 'backup run')

        // a copy: changing it does not change the live task
        log.status = 'changed'
        assert.equal((await tasks.get(id)).status, 'pending')

        release()
        await flush()
      })

      it('handler.end() does nothing once the root ended, even with subtasks left open by the source', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const updates = []
        const onLogFct = tasks.createExternalProgressHandler({
          onTaskUpdate: (log, event) => updates.push(`${log.id}:${event.type}`),
        })
        const id = 'root-left-child-open'
        const timestamp = Date.now()
        onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
        onLogFct({ type: 'start', id: `${id}-child`, parentId: id, timestamp, properties: { name: 'vm' } })
        onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })
        await flush()
        updates.length = 0

        onLogFct.end()
        await flush()

        assert.deepEqual(updates, [])
        const log = fake.data.get(id)
        assert.equal(log.status, 'success')
        assert.equal(log.tasks[0].status, 'pending')
      })
    })

    it('keeps answering with the final state when its write to the store failed (5)', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      const id = 'ext-write-fails'
      const onLogFct = tasks.createExternalProgressHandler()
      const timestamp = Date.now()
      onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
      await flush()

      fake.failPut(id)
      onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })
      await flush()

      // the store keeps the stale pending state: the answer must come from the live log
      assert.equal(fake.data.get(id).status, 'pending')
      const result = await Promise.race([finalState(tasks, id), sleep(200).then(() => 'timeout')])
      assert.equal(result.status, 'success')
    })

    describe('abort errors (4.3)', () => {
      it('refuses to abort a running external task without abort option, with forbiddenOperation', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const onLogFct = tasks.createExternalProgressHandler()
        const id = 'ext-no-abort'
        onLogFct({ type: 'start', id, timestamp: Date.now(), properties: { name: 'backup run' } })

        await assert.rejects(tasks.abort(id, 'why'), error => {
          assert.equal(forbiddenOperation.is(error), true)
          assert.equal(error.data.operation, 'abort')
          return true
        })
      })

      it('answers noSuchObject for an unknown task', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        await assert.rejects(tasks.abort('unknown', 'why'), error => noSuchObject.is(error))
      })

      it('answers noSuchObject for a finished external task', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const onLogFct = tasks.createExternalProgressHandler()
        const id = 'ext-finished'
        const timestamp = Date.now()
        onLogFct({ type: 'start', id, timestamp, properties: { name: 'backup run' } })
        onLogFct({ type: 'end', id, timestamp: timestamp + 1, status: 'success', result: 'done' })

        await assert.rejects(tasks.abort(id, 'late'), error => noSuchObject.is(error))
      })

      it('still aborts an internal task through Task#abort', async () => {
        const fake = makeApp()
        const tasks = new Tasks(fake.app)
        await fake.start()

        const task = tasks.create({ name: 'internal, abortable' })
        const pRun = task.run(
          () =>
            new Promise((resolve, reject) => {
              Task.abortSignal.addEventListener('abort', () => reject(new Error('aborted')))
            })
        )
        await flush()

        await tasks.abort(task.id, 'stop')
        await assert.rejects(pRun, /aborted/)
      })
    })

    it('rejects watching an unknown task with noSuchObject', async () => {
      const fake = makeApp()
      const tasks = new Tasks(fake.app)
      await fake.start()

      await assert.rejects(
        tasks.watch('unknown', () => {}),
        { code: 1 }
      )
    })
  })
})
