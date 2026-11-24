import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { makeOnProgress } from '@vates/task/combineEvents'
import { Task } from '@vates/task'

import { runInMainThread } from './_runInMainThread.mjs'

const noop = Function.prototype

// the parts of `app` used by `runInMainThread()`: the tasks mixin keeps the `abort` function of each running root
// task, as `createExternalProgressHandler({ abort })` does, and `tasks.abort(id, reason, options)` calls it
function createApp() {
  const aborts = new Map()
  const logs = []
  const app = {
    apiContext: undefined,
    logs,
    tasks: {
      abort(id, reason, options) {
        const abort = aborts.get(id)
        if (abort === undefined) {
          throw new Error('no such task ' + id)
        }
        return abort(reason, options)
      },
      createExternalProgressHandler({ abort, onRootTaskStart, onTaskUpdate }) {
        return makeOnProgress({
          onRootTaskStart(log, event) {
            logs.push(log)
            if (abort !== undefined) {
              aborts.set(log.id, abort)
            }
            onRootTaskStart?.(log, event)
          },
          onRootTaskEnd(log) {
            aborts.delete(log.id)
          },
          onTaskUpdate,
        })
      },
    },
  }
  return app
}

// the backup: waits for the abort, then runs a step as the runners do
const backupUntilAborted = () =>
  new Promise(resolve => Task.abortSignal.addEventListener('abort', resolve, { once: true })).then(() =>
    Task.run({ properties: { name: 'transfer' } }, noop)
  )

// runs `fn` with `user` as the user of the API call, as `app.runWithApiContext()` does
const asUser = (app, user, fn) => {
  app.apiContext = { user }
  try {
    return fn()
  } finally {
    app.apiContext = undefined
  }
}

const properties = { name: 'backup run' }

describe('runInMainThread()', () => {
  it('is aborted by tasks.abort() with an AbortError, whatever the reason given', async () => {
    const app = createApp()
    const pRun = runInMainThread({
      app,
      fn: backupUntilAborted,
      onRootTaskStart: log => setImmediate(() => app.tasks.abort(log.id, { not: 'an error' })),
      properties,
    })

    await assert.rejects(pRun, { name: 'AbortError' })
    const [log] = app.logs
    assert.equal(log.status, 'failure')
    assert.equal(log.result.name, 'AbortError')
    assert.equal(log.tasks[0].status, 'failure')
  })

  it('fails with an AbortError even when the backup resolves after the abort', async () => {
    const app = createApp()
    const pRun = runInMainThread({
      app,
      // as the runners do: the VM backups failed, but their errors are handled in their tasks
      fn: () =>
        new Promise(resolve => Task.abortSignal.addEventListener('abort', resolve, { once: true })).then(() => 'done'),
      onRootTaskStart: log => setImmediate(() => app.tasks.abort(log.id)),
      properties,
    })

    await assert.rejects(pRun, { name: 'AbortError' })
    assert.equal(app.logs[0].status, 'failure')
    assert.equal(app.logs[0].result.name, 'AbortError')
  })

  it('records who requested the abort, by the id of the user only', async () => {
    const app = createApp()
    const user = { id: 'user-id', email: 'admin@admin.net' }
    const pRun = runInMainThread({
      app,
      fn: backupUntilAborted,
      onRootTaskStart: log => setImmediate(() => asUser(app, user, () => app.tasks.abort(log.id))),
      properties,
    })

    await assert.rejects(pRun, { name: 'AbortError' })
    const [log] = app.logs
    assert.deepEqual(
      log.infos.map(({ message, data }) => ({ message, data })),
      [{ message: 'abort requested', data: { type: 'abortRequested', userId: 'user-id' } }]
    )
  })

  it('records no user when the abort is not requested by a user', async () => {
    const app = createApp()
    const pRun = runInMainThread({
      app,
      fn: backupUntilAborted,
      onRootTaskStart: log => setImmediate(() => app.tasks.abort(log.id)),
      properties,
    })

    await assert.rejects(pRun, { name: 'AbortError' })
    assert.equal(app.logs[0].infos, undefined)
  })

  it('is aborted with the task it is called from, as the REST action "run schedule"', async () => {
    const app = createApp()
    const user = { id: 'user-id', email: 'admin@admin.net' }
    const action = new Task({ onProgress: noop })

    const pAction = action.run(() =>
      runInMainThread({
        app,
        fn: backupUntilAborted,
        onRootTaskStart: () => setImmediate(() => asUser(app, user, () => action.abort())),
        properties,
      })
    )

    await assert.rejects(pAction, { name: 'AbortError' })
    const [log] = app.logs
    assert.equal(log.status, 'failure')
    assert.equal(log.result.name, 'AbortError')
    assert.deepEqual(log.infos[0].data, { type: 'abortRequested', userId: 'user-id' })
  })

  it('is aborted by the signal of the job run, as jobs.cancelJobRun()', async () => {
    const app = createApp()
    const user = { id: 'user-id', email: 'admin@admin.net' }
    const controller = new AbortController()

    const pRun = runInMainThread({
      app,
      fn: backupUntilAborted,
      onRootTaskStart: () => setImmediate(() => asUser(app, user, () => controller.abort())),
      properties,
      signal: controller.signal,
    })

    await assert.rejects(pRun, { name: 'AbortError' })
    const [log] = app.logs
    assert.equal(log.status, 'failure')
    assert.equal(log.tasks[0].status, 'failure', 'the step started after the abort is skipped')
    assert.deepEqual(log.infos[0].data, { type: 'abortRequested', userId: 'user-id' })
  })

  it('records a single abort request when aborted by several ways', async () => {
    const app = createApp()
    const user = { id: 'user-id', email: 'admin@admin.net' }
    const controller = new AbortController()

    const pRun = runInMainThread({
      app,
      fn: backupUntilAborted,
      onRootTaskStart: log =>
        setImmediate(() =>
          asUser(app, user, () => {
            controller.abort()
            app.tasks.abort(log.id)
          })
        ),
      properties,
      signal: controller.signal,
    })

    await assert.rejects(pRun, { name: 'AbortError' })
    assert.equal(app.logs[0].infos.length, 1)
  })

  it('does not run the backup when the job run is already cancelled', async () => {
    const app = createApp()
    let called = false

    await assert.rejects(
      runInMainThread({
        app,
        fn: () => {
          called = true
        },
        properties,
        signal: AbortSignal.abort(),
      }),
      { name: 'AbortError' }
    )

    assert.equal(called, false)
  })

  it('does not run the backup when the task it is called from is already aborted', async () => {
    const app = createApp()
    const action = new Task({ onProgress: noop })
    let called = false

    await action
      .run(async () => {
        action.abort()
        await assert.rejects(
          runInMainThread({
            app,
            fn: () => {
              called = true
            },
            properties,
          }),
          { name: 'AbortError' }
        )
      })
      .catch(noop)

    assert.equal(called, false)
    assert.equal(app.logs[0].status, 'failure')
  })

  it('no longer follows the task it is called from once ended', async () => {
    const app = createApp()
    const action = new Task({ onProgress: noop })

    await action.run(async () => {
      assert.equal(await runInMainThread({ app, fn: () => 'done', properties }), 'done')

      // would throw (task already ended) if the listener was still registered
      action.abort()
    })

    assert.equal(app.logs[0].status, 'success')
    assert.equal(app.logs[0].infos, undefined)
  })

  it('does not affect another run', async () => {
    const app = createApp()
    let otherSignal
    const other = runInMainThread({
      app,
      fn: async () => {
        otherSignal = Task.abortSignal
        await new Promise(resolve => setTimeout(resolve, 50))
        return Task.run({ properties: { name: 'transfer' } }, () => 'done')
      },
      properties,
    })
    const aborted = runInMainThread({
      app,
      fn: backupUntilAborted,
      onRootTaskStart: log => setImmediate(() => app.tasks.abort(log.id)),
      properties,
    })

    await assert.rejects(aborted, { name: 'AbortError' })
    assert.equal(await other, 'done')
    assert.equal(otherSignal.aborted, false)
    assert.deepEqual(
      app.logs.map(_ => _.status),
      ['success', 'failure']
    )
  })
})

describe('runInMainThread(), skipping the cleanup', () => {
  const skipCleanup = { skipCleanup: true }
  const user = { id: 'user-id', email: 'admin@admin.net' }
  const messages = log => log.infos?.map(({ message }) => message)

  // the backup: aborted at level 1, then runs a cleanup subtask until its own signal is aborted
  const backupWithCleanup =
    (rootId, seen = {}) =>
    async () => {
      await new Promise(resolve => Task.abortSignal.addEventListener('abort', resolve, { once: true }))
      await Task.run({ properties: { name: 'cleanup' }, cleanup: true }, async () => {
        const signal = Task.abortSignal
        seen.cleanupAbortedBefore = signal.aborted
        // the user escalates while the cleanup runs
        setImmediate(() => asUser(rootId.app, user, () => rootId.app.tasks.abort(rootId.id, undefined, skipCleanup)))
        // a cleanup that nobody aborts would wait for ever: give up, the assertion then fails instead of hanging
        await new Promise(resolve => {
          const timer = setTimeout(resolve, 500)
          signal.addEventListener(
            'abort',
            () => {
              clearTimeout(timer)
              resolve()
            },
            { once: true }
          )
        })
        seen.cleanupAborted = signal.aborted
        seen.reasonName = signal.reason?.name
      })
    }

  it('aborts a cleanup subtask running after the abort', async () => {
    const app = createApp()
    const root = { app }
    const seen = {}
    const pRun = runInMainThread({
      app,
      fn: backupWithCleanup(root, seen),
      onRootTaskStart: log => {
        root.id = log.id
        setImmediate(() => app.tasks.abort(log.id))
      },
      properties,
    })

    await assert.rejects(pRun, { name: 'AbortError' })
    assert.equal(seen.cleanupAbortedBefore, false, 'the cleanup runs after the level 1 abort')
    assert.equal(seen.cleanupAborted, true)
    assert.equal(seen.reasonName, 'AbortError', 'the reason stays an AbortError')
    assert.equal(app.logs[0].result.name, 'AbortError')
  })

  it('aborts the run and its cleanup when the cleanup is skipped without a previous abort', async () => {
    const app = createApp()
    const seen = {}
    const pRun = runInMainThread({
      app,
      fn: async () => {
        const [abortSignal, cleanupSignal] = [Task.abortSignal, Task.cleanupSignal]
        await new Promise(resolve => abortSignal.addEventListener('abort', resolve, { once: true }))
        seen.states = [abortSignal.aborted, cleanupSignal.aborted]
        seen.reasons = [abortSignal.reason?.name, cleanupSignal.reason?.name]
      },
      onRootTaskStart: log => setImmediate(() => app.tasks.abort(log.id, { not: 'an error' }, skipCleanup)),
      properties,
    })

    await assert.rejects(pRun, { name: 'AbortError' })
    assert.deepEqual(seen.states, [true, true])
    assert.deepEqual(seen.reasons, ['AbortError', 'AbortError'])
  })

  it('does not abort the cleanup of a plain abort', async () => {
    const app = createApp()
    const seen = {}
    const pRun = runInMainThread({
      app,
      fn: async () => {
        const cleanupSignal = Task.cleanupSignal
        await new Promise(resolve => Task.abortSignal.addEventListener('abort', resolve, { once: true }))
        seen.cleanupAborted = cleanupSignal.aborted
      },
      onRootTaskStart: log => setImmediate(() => app.tasks.abort(log.id, undefined, { skipCleanup: false })),
      properties,
    })

    await assert.rejects(pRun, { name: 'AbortError' })
    assert.equal(seen.cleanupAborted, false)
  })

  it('records who skipped the cleanup, after who aborted, by the id of the user only', async () => {
    const app = createApp()
    const root = { app }
    const pRun = runInMainThread({
      app,
      fn: backupWithCleanup(root),
      onRootTaskStart: log => {
        root.id = log.id
        setImmediate(() => asUser(app, user, () => app.tasks.abort(log.id)))
      },
      properties,
    })

    await assert.rejects(pRun, { name: 'AbortError' })
    const [log] = app.logs
    assert.deepEqual(messages(log), ['abort requested', 'cleanup skip requested'])
    assert.deepEqual(log.infos[1].data, { type: 'cleanupSkipRequested', userId: 'user-id' })
  })

  it('records both requests when the cleanup is skipped without a previous abort', async () => {
    const app = createApp()
    const pRun = runInMainThread({
      app,
      fn: backupUntilAborted,
      onRootTaskStart: log =>
        setImmediate(() => asUser(app, user, () => app.tasks.abort(log.id, undefined, skipCleanup))),
      properties,
    })

    await assert.rejects(pRun, { name: 'AbortError' })
    assert.deepEqual(messages(app.logs[0]), ['abort requested', 'cleanup skip requested'])
  })

  it('records no user when the skip is not requested by a user', async () => {
    const app = createApp()
    const pRun = runInMainThread({
      app,
      fn: backupUntilAborted,
      onRootTaskStart: log => setImmediate(() => app.tasks.abort(log.id, undefined, skipCleanup)),
      properties,
    })

    await assert.rejects(pRun, { name: 'AbortError' })
    assert.equal(app.logs[0].infos, undefined)
  })

  it('changes nothing when the run is aborted again after the cleanup was skipped', async () => {
    const app = createApp()
    const pRun = runInMainThread({
      app,
      fn: async () => {
        await new Promise(resolve => Task.abortSignal.addEventListener('abort', resolve, { once: true }))
        await new Promise(resolve => setImmediate(resolve))
      },
      onRootTaskStart: log =>
        setImmediate(() =>
          asUser(app, user, () => {
            app.tasks.abort(log.id, undefined, skipCleanup)
            app.tasks.abort(log.id)
            app.tasks.abort(log.id, undefined, skipCleanup)
          })
        ),
      properties,
    })

    await assert.rejects(pRun, { name: 'AbortError' })
    assert.deepEqual(messages(app.logs[0]), ['abort requested', 'cleanup skip requested'])
  })

  it('only aborts the run, not its cleanup, with the task it is called from ("run schedule")', async () => {
    const app = createApp()
    const action = new Task({ onProgress: noop })
    const seen = {}

    const pAction = action.run(() =>
      runInMainThread({
        app,
        fn: async () => {
          const cleanupSignal = Task.cleanupSignal
          setImmediate(() => action.abort())
          await new Promise(resolve => Task.abortSignal.addEventListener('abort', resolve, { once: true }))
          seen.cleanupAborted = cleanupSignal.aborted
        },
        properties,
      })
    )

    await assert.rejects(pAction, { name: 'AbortError' })
    assert.equal(seen.cleanupAborted, false)
  })

  it('skips the cleanup of the run when the cleanup of the task it is called from is skipped', async () => {
    const app = createApp()
    const user = { id: 'user-id', email: 'admin@admin.net' }
    const action = new Task({ onProgress: noop })
    const seen = {}

    const pAction = action.run(() =>
      runInMainThread({
        app,
        fn: async () => {
          await new Promise(resolve => Task.abortSignal.addEventListener('abort', resolve, { once: true }))
          await Task.run({ properties: { name: 'cleanup' }, cleanup: true }, async () => {
            const signal = Task.abortSignal
            setImmediate(() => asUser(app, user, () => action.abortCleanup()))
            await new Promise(resolve => {
              signal.addEventListener('abort', resolve, { once: true })
              setTimeout(resolve, 1000)
            })
            seen.cleanupAborted = signal.aborted
          })
        },
        onRootTaskStart: () => setImmediate(() => action.abort()),
        properties,
      })
    )

    await assert.rejects(pAction, { name: 'AbortError' })
    assert.equal(seen.cleanupAborted, true)
    assert.deepEqual(messages(app.logs[0]), ['cleanup skip requested'])
  })

  it('does not stop the cleanup of another run', async () => {
    const app = createApp()
    const seen = {}
    const other = runInMainThread({
      app,
      fn: async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        // the cleanup of a run that ends normally, while the first one is aborted and skipped
        await Task.run({ properties: { name: 'cleanup' }, cleanup: true }, () => {
          seen.cleanupAborted = Task.abortSignal.aborted
        })
        seen.cleanupSignalAborted = Task.cleanupSignal.aborted
        return 'done'
      },
      properties,
    })
    const skipped = runInMainThread({
      app,
      fn: backupUntilAborted,
      onRootTaskStart: log => setImmediate(() => app.tasks.abort(log.id, undefined, skipCleanup)),
      properties,
    })

    await assert.rejects(skipped, { name: 'AbortError' })
    assert.equal(await other, 'done')
    assert.deepEqual(seen, { cleanupAborted: false, cleanupSignalAborted: false })
    assert.deepEqual(
      app.logs.map(_ => _.status),
      ['success', 'failure']
    )
  })
})
