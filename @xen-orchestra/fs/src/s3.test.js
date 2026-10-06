import { after, before, describe, it, beforeEach, afterEach, mock } from 'node:test'
import { strict as assert } from 'assert'

import 'dotenv/config'
import sinon from 'sinon'
import { S3Client } from '@aws-sdk/client-s3'
import { getHandler } from '.'
import S3Handler from './s3.js'

// needs a real bucket, without Object Lock, from a provider which honours conditional writes: anywhere
// else the lock is the no-op one, the second `lock()` succeeds, and this test fails — which is how it
// tells that a provider is not supported
//
//   xo_fs_s3='s3://<key>:<secret>@<host>/<bucket>/<dir>' yarn workspace @xen-orchestra/fs test
const url = process.env.xo_fs_s3

describe('S3Handler#lock()', { skip: url === undefined }, () => {
  let handler

  before(async () => {
    handler = getHandler({ url }).addPrefix(`xo-fs-tests-${Date.now()}`)
    await handler.sync()
  })

  after(async () => {
    await handler?.forget()
  })

  it('refuses a held lock until it is released', async () => {
    const lock = await handler.lock('vm')
    try {
      await assert.rejects(handler.lock('vm'), { code: 'ELOCKED' })
    } finally {
      await lock.dispose()
    }

    const again = await handler.lock('vm')
    await again.dispose()
  })
})

describe('S3Handler#_lock with stubbed S3Client', () => {
  let sendStub
  let objectStore

  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })
    objectStore = new Map()

    sendStub = sinon.stub(S3Client.prototype, 'send')

    sendStub.callsFake(async function (command) {
      const commandName = command.constructor.name
      const key = command.input?.Key

      if (commandName === 'PutObjectCommand') {
        const { IfNoneMatch, IfMatch } = command.input
        const current = objectStore.get(key)

        // If-NoneMatch: create only if key doesn't exist
        if (IfNoneMatch === '*') {
          if (current !== undefined) {
            const error = new Error('Precondition Failed')
            error.$metadata = { httpStatusCode: 412 }
            throw error
          }
        }

        // If-Match: replace only if ETag matches
        if (IfMatch !== undefined) {
          if (current?.etag !== IfMatch) {
            const error = new Error('Precondition Failed')
            error.$metadata = { httpStatusCode: 412 }
            throw error
          }
        }

        const newETag = `"etag-${Date.now()}-${Math.random()}"`.replace(/\./g, '')
        objectStore.set(key, {
          etag: newETag,
          body: command.input.Body,
          lastModified: new Date(),
        })
        return { ETag: newETag }
      }

      if (commandName === 'GetObjectCommand') {
        const current = objectStore.get(key)
        if (current === undefined) {
          const error = new Error('NoSuchKey')
          error.name = 'NoSuchKey'
          throw error
        }

        return {
          ETag: current.etag,
          Body: { transformToString: async () => current.body },
          LastModified: current.lastModified,
        }
      }

      if (commandName === 'DeleteObjectCommand') {
        objectStore.delete(key)
        return {}
      }

      throw new Error(`Unexpected command: ${commandName}`)
    })
  })

  afterEach(() => {
    sendStub.restore()
    mock.timers.reset()
    objectStore.clear()
  })

  it('acquires and releases a lock through stubbed S3 with correct response shapes', async () => {
    const handler = new S3Handler({ url: 's3://key:secret@localhost/bucket/dir' })

    // probe should succeed and mark conditional writes as supported
    const release = await handler._lock('vm')

    // verify lock object was created with correct key
    assert(objectStore.has('dir/vm.lock'), 'lock object should be created in S3')
    const lockObj = objectStore.get('dir/vm.lock')
    assert(lockObj.etag !== undefined, 'lock object should have ETag')
    const lockBody = JSON.parse(lockObj.body)
    assert(lockBody.id !== undefined, 'lock body should have id')
    assert.equal(lockBody.seq, 0, 'lock body should start at seq 0')

    // tick the refresh interval to trigger a refresh
    mock.timers.tick(30000) // REFRESH_INTERVAL
    await new Promise(resolve => setImmediate(resolve))

    // verify lock was refreshed (new ETag due to new seq)
    const refreshedLockObj = objectStore.get('dir/vm.lock')
    assert(refreshedLockObj.etag !== lockObj.etag, 'lock should be refreshed')
    const refreshedBody = JSON.parse(refreshedLockObj.body)
    assert.equal(refreshedBody.seq, 1, 'seq should increment on refresh')

    // release lock
    await release()

    // verify lock object was deleted
    assert(!objectStore.has('dir/vm.lock'), 'lock object should be deleted after release')
  })

  it('rejects a held lock', async () => {
    const handler = new S3Handler({ url: 's3://key:secret@localhost/bucket/dir' })

    const release1 = await handler._lock('vm')
    try {
      await assert.rejects(handler._lock('vm'), { code: 'ELOCKED' })
    } finally {
      await release1()
    }
  })
})
