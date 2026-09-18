import assert from 'assert/strict'
import test from 'node:test'

import { noSuchObject } from 'xo-common/api-errors.js'

import validateJobUser from './validate-job-user.mjs'

const { describe, it } = test

describe('validateJobUser()', () => {
  it('reports the sequence and preserves the missing-user error shape', async () => {
    await assert.rejects(
      validateJobUser(
        {
          getUser: async () => {
            noSuchObject('user-1', 'user')
          },
        },
        {
          id: 'sequence-1',
          method: 'schedule.runSequence',
          type: 'call',
          userId: 'user-1',
        }
      ),
      error => {
        assert.equal(
          error.message,
          'no such user user-1 for sequence sequence-1, it might have been deleted. Please save the sequence with another user to update it'
        )
        assert.equal(error.code, 1)
        assert.deepEqual(error.data, { id: 'user-1', type: 'user' })
        return true
      }
    )
  })

  it('does not validate ordinary jobs', async () => {
    let calls = 0
    await validateJobUser(
      {
        getUser: async () => {
          calls++
        },
      },
      { id: 'job-1', method: 'some.method', type: 'call', userId: 'user-1' }
    )
    assert.equal(calls, 0)
  })
})
