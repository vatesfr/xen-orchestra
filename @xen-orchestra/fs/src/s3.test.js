import { after, before, describe, it, beforeEach, afterEach, mock } from 'node:test'
import { strict as assert } from 'assert'

import 'dotenv/config'
import sinon from 'sinon'
import {
  DeleteObjectCommand,
  GetObjectLockConfigurationCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getHandler } from '.'
import S3Handler, { LOCK_TIMEOUT, REFRESH_INTERVAL, STALE_AFTER } from './s3.js'

// needs a real bucket without Object Lock: on an Object Lock bucket the lock is the no-op one, the second
// `lock()` succeeds, and this test fails
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

const createHandler = () => new S3Handler({ url: 's3://key:secret@localhost/bucket/dir' })

const s3Error = (name, httpStatusCode) => Object.assign(new Error(name), { name, $metadata: { httpStatusCode } })

// lets the async callback of a timer which just fired run to its end
const flush = () => new Promise(resolve => setImmediate(resolve))

const KEY = 'dir/vm.lock'

// `S3Handler#_lock()` against a stubbed `S3Client#send()`, which honours `IfMatch` as S3 does
describe('S3Handler#_lock() with a stubbed S3Client', () => {
  // by key
  let objects
  // what the provider does wrong, which each test sets
  let faults
  let send

  const seqOf = key => JSON.parse(objects.get(key).body).seq

  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] })
    objects = new Map()
    faults = {}

    let n = 0
    send = sinon.stub(S3Client.prototype, 'send').callsFake(async command => {
      const { Body, IfMatch, Key } = command.input
      let current = objects.get(Key)

      if (command instanceof PutObjectCommand) {
        if (faults.hangPut) {
          return new Promise(() => {})
        }
        // another contender takes the lock over between the read and this write
        if (faults.takeOverBeforePut) {
          faults.takeOverBeforePut = false
          current = { etag: '"contender"', body: '{"id":"contender","seq":0}', lastModified: new Date() }
          objects.set(Key, current)
        }
        if (faults.putStatus !== undefined) {
          throw s3Error('InternalError', faults.putStatus)
        }
        if (IfMatch !== undefined && current === undefined) {
          throw s3Error('NoSuchKey', 404)
        }
        if (IfMatch !== undefined && IfMatch !== current.etag) {
          throw s3Error('PreconditionFailed', 412)
        }
        const etag = `"${++n}"`
        objects.set(Key, { etag, body: Body, lastModified: new Date() })
        return { ETag: etag }
      }

      if (command instanceof HeadObjectCommand) {
        if (current === undefined) {
          throw s3Error('NotFound', 404)
        }
        return { ETag: current.etag, LastModified: current.lastModified }
      }

      if (command instanceof DeleteObjectCommand) {
        objects.delete(Key)
        return {}
      }

      if (command instanceof GetObjectLockConfigurationCommand) {
        if (faults.objectLock) {
          return { ObjectLockConfiguration: { ObjectLockEnabled: 'Enabled' } }
        }
        throw s3Error('AccessDenied', 403)
      }

      throw new Error(`unexpected ${command.constructor.name}`)
    })
  })

  afterEach(() => {
    send.restore()
    mock.timers.reset()
  })

  for (const [what, objectLock] of [
    ['on an Object Lock bucket', true],
    ['when the S3 user cannot read the Object Lock configuration', false],
  ]) {
    it(`takes no lock ${what}`, async () => {
      faults.objectLock = objectLock
      const handler = createHandler()
      await handler._sync()
      assert.equal(handler.isImmutable(), objectLock)

      const release = await handler._lock('vm')
      await release()
      // the only request read the Object Lock configuration
      assert.equal(send.callCount, 1)
    })
  }

  it('takes <path>.lock in the directory of the remote, rewrites it every REFRESH_INTERVAL, and deletes it', async () => {
    const release = await createHandler()._lock('vm')
    const { id, seq } = JSON.parse(objects.get(KEY).body)
    assert.match(id, /^[0-9a-f-]{36}$/)
    assert.equal(seq, 0)

    mock.timers.tick(REFRESH_INTERVAL)
    await flush()
    assert.deepEqual(JSON.parse(objects.get(KEY).body), { id, seq: 1 })

    await release()
    assert.equal(objects.has(KEY), false)
  })

  it('refuses a held lock, and leaves it untouched', async () => {
    const handler = createHandler()
    const release = await handler._lock('vm')
    try {
      const { body } = objects.get(KEY)
      await assert.rejects(handler._lock('vm'), { code: 'ELOCKED' })
      assert.equal(objects.get(KEY).body, body)
    } finally {
      await release()
    }
  })

  it('takes over a stale lock, not a fresh one', async () => {
    objects.set(KEY, { etag: '"other"', body: '{"id":"other","seq":0}', lastModified: new Date() })

    mock.timers.tick(STALE_AFTER)
    await assert.rejects(createHandler()._lock('vm'), { code: 'ELOCKED' })

    mock.timers.tick(1)
    const release = await createHandler()._lock('vm')
    assert.notEqual(JSON.parse(objects.get(KEY).body).id, 'other')
    await release()
  })

  it('refuses a stale lock someone else took over first', async () => {
    objects.set(KEY, { etag: '"other"', body: '{"id":"other","seq":0}', lastModified: new Date() })
    mock.timers.tick(STALE_AFTER + 1)

    faults.takeOverBeforePut = true

    await assert.rejects(createHandler()._lock('vm'), { code: 'ELOCKED' })
    assert.equal(JSON.parse(objects.get(KEY).body).id, 'contender')
  })

  it('gives up a lock someone else took, stops refreshing it, and does not delete it', async () => {
    const release = await createHandler()._lock('vm')
    objects.set(KEY, { etag: '"other"', body: '{"id":"other","seq":0}', lastModified: new Date() })

    mock.timers.tick(REFRESH_INTERVAL)
    await flush()
    const requests = send.callCount
    mock.timers.tick(REFRESH_INTERVAL)
    await flush()
    assert.equal(send.callCount, requests)

    await release()
    assert.equal(JSON.parse(objects.get(KEY).body).id, 'other')
  })

  it('keeps the lock when a refresh fails, and refreshes again', async () => {
    const release = await createHandler()._lock('vm')

    faults.putStatus = 500
    mock.timers.tick(REFRESH_INTERVAL)
    await flush()
    assert.equal(seqOf(KEY), 0)

    faults.putStatus = undefined
    mock.timers.tick(REFRESH_INTERVAL)
    await flush()
    // the failed refresh used seq 1
    assert.equal(seqOf(KEY), 2)

    await release()
    assert.equal(objects.has(KEY), false)
  })

  it('gives up a refresh which hangs, and refreshes again', async () => {
    const release = await createHandler()._lock('vm')

    faults.hangPut = true
    mock.timers.tick(REFRESH_INTERVAL)
    await flush()
    mock.timers.tick(LOCK_TIMEOUT)
    await flush()

    faults.hangPut = false
    mock.timers.tick(REFRESH_INTERVAL - LOCK_TIMEOUT)
    await flush()
    assert.equal(seqOf(KEY), 2)

    await release()
    assert.equal(objects.has(KEY), false)
  })
})
