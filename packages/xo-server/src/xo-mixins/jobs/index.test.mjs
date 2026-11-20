import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import test from 'node:test'

import Jobs from './index.mjs'

const { describe, it } = test

// a Jobs instance with a fake app and logger, and an executor that waits until it is released
function setup() {
  const app = new EventEmitter()
  app.hooks = new EventEmitter()
  app.createApiConnection = () => ({ close() {}, set() {} })

  const jobs = new Jobs(app)
  let nextRunId = 0
  jobs._logger = {
    notice: async () => String(++nextRunId),
    error: async () => {},
  }
  jobs.updateJob = async () => {}

  let release
  const released = new Promise(resolve => (release = resolve))
  let received
  jobs.registerJobExecutor('test', async params => {
    received = params
    await released
    params.signal.throwIfAborted()
  })

  // `key` is set so that runJob() does not look for a backup log
  const job = { id: 'job', key: 'test', type: 'test', userId: 'user' }
  const run = jobs.runJob(job)
  run.catch(() => {})

  return {
    getParams: () => received,
    jobs,
    release,
    run,
  }
}

const tick = () => new Promise(resolve => setImmediate(resolve))

describe('Jobs', () => {
  it('passes a signal that is not aborted to the executor, and no cancelToken', async () => {
    const { getParams, release, run } = setup()
    await tick()

    const params = getParams()
    assert.ok(params.signal instanceof AbortSignal)
    assert.equal(params.signal.aborted, false)
    assert.equal('cancelToken' in params, false)

    release()
    await run
  })

  it('cancelJobRun() aborts the signal of the run', async () => {
    const { getParams, jobs, release, run } = setup()
    await tick()

    const { runJobId, signal } = getParams()
    jobs.cancelJobRun(runJobId)
    assert.equal(signal.aborted, true)

    release()
    await assert.rejects(run, { name: 'AbortError' })
  })

  it('cancelJobRun() with an unknown run id does nothing', async () => {
    const { getParams, jobs, release, run } = setup()
    await tick()

    assert.equal(jobs.cancelJobRun('unknown'), undefined)
    assert.equal(getParams().signal.aborted, false)

    release()
    await run
  })

  it('cancelJobRun() does not abort the signal of a run that has ended', async () => {
    const { getParams, jobs, release, run } = setup()
    await tick()
    const { runJobId, signal } = getParams()

    release()
    await run
    jobs.cancelJobRun(runJobId)
    assert.equal(signal.aborted, false)
  })
})
