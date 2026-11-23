import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { makeOnProgress } from '@vates/task/combineEvents'
import { Task } from '@vates/task'

import { runInMainThread } from './_runInMainThread.mjs'

const noop = Function.prototype

// the parts of `app` used by `runInMainThread()`: the tasks mixin keeps the `abort` function of each running root
// task, as `createExternalProgressHandler({ abort })` does, and `tasks.abort(id, reason)` calls it
function createApp() {
  const aborts = new Map()
  const logs = []
  const app = {
    apiContext: undefined,
    logs,
    tasks: {
      abort(id, reason) {
        const abort = aborts.get(id)
        if (abort === undefined) {
          throw new Error('no such task ' + id)
        }
        return abort(reason)
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

  it('records who requested the abort', async () => {
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
      [{ message: 'abort requested by admin@admin.net', data: { userId: 'user-id' } }]
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
    assert.equal(log.infos[0].message, 'abort requested by admin@admin.net')
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
