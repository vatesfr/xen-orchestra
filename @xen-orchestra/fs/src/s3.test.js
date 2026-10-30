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
import S3Handler, { REFRESH_INTERVAL, STALE_AFTER } from './s3.js'

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

// `S3Handler#_lock()` against a stubbed `S3Client#send()`
describe('S3Handler#_lock() with a stubbed S3Client', () => {
  // by key
  let objects
  // what the provider does wrong, which each test sets
  let faults
  let send

  beforeEach(() => {
    mock.timers.enable({ apis: ['setInterval', 'Date'] })
    objects = new Map()
    faults = {}

    send = sinon.stub(S3Client.prototype, 'send').callsFake(async command => {
      const { Key } = command.input
      const current = objects.get(Key)

      if (command instanceof PutObjectCommand) {
        if (faults.putStatus !== undefined) {
          throw s3Error('InternalError', faults.putStatus)
        }
        // resolved by the test
        if (faults.pendingPut !== undefined) {
          await faults.pendingPut
        }
        objects.set(Key, { lastModified: new Date() })
        return {}
      }

      if (command instanceof HeadObjectCommand) {
        if (current === undefined) {
          throw s3Error('NotFound', 404)
        }
        return { LastModified: current.lastModified }
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

  const writes = () => send.getCalls().filter(call => call.args[0] instanceof PutObjectCommand).length

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
    assert.equal(objects.get(KEY).lastModified.getTime(), Date.now())

    mock.timers.tick(REFRESH_INTERVAL)
    await flush()
    assert.equal(writes(), 2)
    assert.equal(objects.get(KEY).lastModified.getTime(), Date.now())

    await release()
    assert.equal(objects.has(KEY), false)
  })

  it('refuses a held lock, and leaves it untouched', async () => {
    const handler = createHandler()
    const release = await handler._lock('vm')
    try {
      await assert.rejects(handler._lock('vm'), { code: 'ELOCKED' })
      assert.equal(writes(), 1)
    } finally {
      await release()
    }
  })

  it('takes over a stale lock, not a fresh one', async () => {
    objects.set(KEY, { lastModified: new Date() })

    mock.timers.tick(STALE_AFTER)
    await assert.rejects(createHandler()._lock('vm'), { code: 'ELOCKED' })

    mock.timers.tick(1)
    const release = await createHandler()._lock('vm')
    assert.equal(objects.get(KEY).lastModified.getTime(), Date.now())
    await release()
  })

  it('keeps the lock when a refresh fails, and refreshes again', async () => {
    const release = await createHandler()._lock('vm')

    faults.putStatus = 500
    mock.timers.tick(REFRESH_INTERVAL)
    await flush()
    assert.equal(objects.get(KEY).lastModified.getTime(), Date.now() - REFRESH_INTERVAL)

    faults.putStatus = undefined
    mock.timers.tick(REFRESH_INTERVAL)
    await flush()
    assert.equal(objects.get(KEY).lastModified.getTime(), Date.now())

    await release()
    assert.equal(objects.has(KEY), false)
  })

  it('waits for a refresh in flight before deleting the lock', async () => {
    const release = await createHandler()._lock('vm')

    let resolvePut
    faults.pendingPut = new Promise(resolve => {
      resolvePut = resolve
    })
    mock.timers.tick(REFRESH_INTERVAL)

    const released = release()
    await flush()
    assert.equal(objects.has(KEY), true)

    resolvePut()
    await released
    assert.equal(objects.has(KEY), false)
  })
})
