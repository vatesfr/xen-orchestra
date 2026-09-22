import assert from 'assert/strict'
import test from 'node:test'

import { create, set } from './job.mjs'

const { describe, it } = test

describe('sequence job ownership', () => {
  it('sets creator and updater when creating a sequence', async () => {
    let createdJob
    const context = {
      apiContext: { user: { id: 'user-1' } },
      createJob: async job => {
        createdJob = job
        return { id: 'job-1' }
      },
    }

    await create.call(context, {
      job: {
        method: 'schedule.runSequence',
        type: 'call',
      },
    })

    assert.deepEqual(createdJob, {
      createdBy: 'user-1',
      method: 'schedule.runSequence',
      type: 'call',
      updatedBy: 'user-1',
      userId: 'user-1',
    })
  })

  it('preserves the creator and updates the executor when editing a sequence', async () => {
    let updatedJob
    const context = {
      apiContext: { user: { id: 'user-2' } },
      getJob: async () => ({
        createdBy: 'user-1',
        id: 'job-1',
        method: 'schedule.runSequence',
        type: 'call',
        updatedBy: 'user-1',
        userId: 'user-1',
      }),
      updateJob: async job => {
        updatedJob = job
      },
    }

    await set.call(context, { job: { id: 'job-1', name: 'Updated sequence' } })

    assert.deepEqual(updatedJob, {
      createdBy: 'user-1',
      id: 'job-1',
      name: 'Updated sequence',
      updatedBy: 'user-2',
      userId: 'user-2',
    })
  })

  it('uses the legacy userId as the creator when editing an old sequence', async () => {
    let updatedJob
    const context = {
      apiContext: { user: { id: 'user-2' } },
      getJob: async () => ({
        id: 'job-1',
        method: 'schedule.runSequence',
        type: 'call',
        userId: 'user-1',
      }),
      updateJob: async job => {
        updatedJob = job
      },
    }

    await set.call(context, { job: { id: 'job-1' } })

    assert.deepEqual(updatedJob, {
      createdBy: 'user-1',
      id: 'job-1',
      updatedBy: 'user-2',
      userId: 'user-2',
    })
  })

  it('does not add sequence metadata to ordinary jobs', async () => {
    let createdJob
    const context = {
      apiContext: { user: { id: 'user-1' } },
      createJob: async job => {
        createdJob = job
        return { id: 'job-1' }
      },
    }

    await create.call(context, {
      job: {
        method: 'some.method',
        type: 'call',
      },
    })

    assert.deepEqual(createdJob, {
      method: 'some.method',
      type: 'call',
      userId: 'user-1',
    })
  })
})
