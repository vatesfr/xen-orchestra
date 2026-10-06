import { after, before, describe, it, beforeEach, afterEach, mock } from 'node:test'
import { strict as assert } from 'assert'

import 'dotenv/config'
import sinon from 'sinon'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectLockConfigurationCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import { Readable } from 'node:stream'
import { getHandler } from '.'
import S3Handler from './s3.js'
import { REFRESH_INTERVAL, REFRESH_TIMEOUT } from './_conditionalLock.js'

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

const createHandler = () => new S3Handler({ url: 's3://key:secret@localhost/bucket/dir' })

const s3Error = (name, httpStatusCode) => Object.assign(new Error(name), { name, $metadata: { httpStatusCode } })

// the lock object of another holder
const OTHER = '{"id":"other","seq":0}'

// the lock store of `S3Handler#_lock()` against a stubbed `S3Client#send()`, which honours the conditions as S3 does
describe('S3Handler#_lock() with a stubbed S3Client', () => {
  // by key
  let objects
  // what the provider does wrong, which each test sets
  let faults
  let send

  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })
    objects = new Map()
    faults = {}

    let n = 0
    send = sinon.stub(S3Client.prototype, 'send').callsFake(async command => {
      const { Body, IfMatch, IfNoneMatch, Key } = command.input
      const current = objects.get(Key)

      if (command instanceof PutObjectCommand) {
        if (faults.hangPut) {
          return new Promise(() => {})
        }
        if (faults.putStatus !== undefined) {
          throw s3Error('ExpiredToken', faults.putStatus)
        }
        // another conditional create on the key is in progress
        if (faults.conflictOnCreate && IfNoneMatch === '*') {
          throw s3Error('ConditionalRequestConflict', 409)
        }
        // the object vanished between the refresh's read and its replace
        if (faults.vanishOnReplace && IfMatch !== undefined) {
          faults.vanishOnReplace = false
          objects.delete(Key)
          throw s3Error('NoSuchKey', 404)
        }
        if (
          (IfNoneMatch === '*' && current !== undefined && !faults.ignoreIfNoneMatch) ||
          (IfMatch !== undefined && IfMatch !== current?.etag)
        ) {
          throw s3Error('PreconditionFailed', 412)
        }
        const etag = `"${++n}"`
        objects.set(Key, { etag, body: Body, lastModified: new Date() })
        return { ETag: faults.omitPutETag ? undefined : etag }
      }

      if (command instanceof GetObjectCommand) {
        // released just before the read
        if (faults.vanishBeforeRead) {
          faults.vanishBeforeRead = false
          objects.delete(Key)
          throw s3Error('NoSuchKey', 404)
        }
        if (current === undefined) {
          throw s3Error('NoSuchKey', 404)
        }
        return {
          ETag: faults.omitGetETag ? undefined : current.etag,
          Body: { transformToString: async () => current.body },
          LastModified: current.lastModified,
        }
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
    it(`takes no lock, without probing, ${what}`, async () => {
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
    const { body } = objects.get('dir/vm.lock')
    assert.equal(JSON.parse(body).seq, 0)

    mock.timers.tick(REFRESH_INTERVAL)
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(JSON.parse(objects.get('dir/vm.lock').body).seq, 1)

    await release()
    assert.equal(objects.has('dir/vm.lock'), false)
  })

  it('refuses a held lock', async () => {
    const handler = createHandler()
    const release = await handler._lock('vm')
    try {
      await assert.rejects(handler._lock('vm'), { code: 'ELOCKED' })
    } finally {
      await release()
    }
  })

  it('takes the lock when the held lock is released between the refused create and its read', async () => {
    const handler = createHandler()
    // the first lock probes the provider, whose own GetObject must not take the fault
    const releaseProbe = await handler._lock('vm')
    await releaseProbe()

    objects.set('dir/vm.lock', { etag: '"seeded"', body: OTHER, lastModified: new Date() })
    faults.vanishBeforeRead = true

    const release = await handler._lock('vm')
    const lock = JSON.parse(objects.get('dir/vm.lock').body)
    assert.equal(lock.seq, 0)
    assert.match(lock.id, /^[0-9a-f]{32}$/)
    await release()
  })

  it('refuses a lock whose create is refused with 409 by a conflicting write, and leaves the holder untouched', async () => {
    const handler = createHandler()
    // the first lock probes the provider, whose own PutObject must not take the fault
    const releaseProbe = await handler._lock('vm')
    await releaseProbe()

    objects.set('dir/vm.lock', { etag: '"seeded"', body: OTHER, lastModified: new Date() })
    faults.conflictOnCreate = true

    await assert.rejects(handler._lock('vm'), { code: 'ELOCKED' })
    assert.equal(objects.get('dir/vm.lock').body, OTHER)
  })

  it('reacquires a lock whose object vanished under a refresh (404 on replace)', async () => {
    const handler = createHandler()
    // the fault is set once the first lock, which probes the provider, is taken
    const release = await handler._lock('vm')
    assert.equal(JSON.parse(objects.get('dir/vm.lock').body).seq, 0)

    faults.vanishOnReplace = true
    mock.timers.tick(REFRESH_INTERVAL)
    await new Promise(resolve => setImmediate(resolve))

    // the refresh found the object gone, and took the lock again: the write after the one which vanished
    assert.equal(JSON.parse(objects.get('dir/vm.lock').body).seq, 2)
    await release()
  })

  for (const [what, fault] of [
    ['refuses conditional writes (501)', { putStatus: 501 }],
    ['answers PutObject without ETag', { omitPutETag: true }],
    ['ignores If-None-Match', { ignoreIfNoneMatch: true }],
    ['answers GetObject without ETag', { omitGetETag: true }],
  ]) {
    it(`takes no lock, and does not probe again, when the provider ${what}`, async () => {
      Object.assign(faults, fault)
      const handler = createHandler()

      const release1 = await handler._lock('vm')
      await release1()
      assert.equal(objects.size, 0)

      const requestsBefore = send.callCount
      const release2 = await handler._lock('vm')
      await release2()
      assert.equal(send.callCount, requestsBefore)
    })
  }

  it('takes no lock when the probe hangs, and probes again on the next lock', async () => {
    faults.hangPut = true
    const handler = createHandler()

    const lock1 = handler._lock('vm')
    // lets the probe reach its timeout, which is armed once its first request is sent
    await new Promise(resolve => setImmediate(resolve))
    mock.timers.tick(REFRESH_TIMEOUT)
    const release1 = await lock1
    await release1()
    assert.equal(objects.size, 0)

    faults.hangPut = false
    const release2 = await handler._lock('vm')
    try {
      assert(objects.has('dir/vm.lock'))
    } finally {
      await release2()
    }
  })

  // a 400 may be about the request rather than the condition: an expired token...
  it('takes no lock when the probe fails, and probes again on the next lock', async () => {
    faults.putStatus = 400
    const handler = createHandler()

    const release1 = await handler._lock('vm')
    await release1()
    assert.equal(objects.size, 0)

    faults.putStatus = undefined
    const release2 = await handler._lock('vm')
    try {
      assert(objects.has('dir/vm.lock'))
    } finally {
      await release2()
    }
  })
})

describe('S3Handler#_lock() judges a lock by the Date of the response, not by the local clock', () => {
  // whole seconds: the `Date` and `Last-Modified` headers have no finer resolution
  const LAST_MODIFIED = Date.UTC(2026, 0, 1, 12)
  const TEN_SECONDS = 10e3
  const TEN_MINUTES = 600e3
  const LOCK_PATH = '/bucket/dir/vm.lock'

  let handle
  let objects
  let serverNow

  // the requests go through the whole middleware stack of the SDK, and stop at its HTTP handler: this is
  // where the `Date` header of the response comes from
  const response = (statusCode, headers = {}, body = '') => ({
    response: {
      statusCode,
      headers: { date: new Date(serverNow).toUTCString(), ...headers },
      body: Readable.from([Buffer.from(body)]),
    },
  })

  beforeEach(() => {
    objects = new Map([[LOCK_PATH, { body: OTHER, etag: '"seeded"', lastModified: LAST_MODIFIED }]])

    let n = 0
    handle = sinon.stub(NodeHttpHandler.prototype, 'handle').callsFake(async ({ method, path, headers, body }) => {
      const current = objects.get(path)

      if (method === 'GET') {
        return response(
          200,
          { etag: current.etag, 'last-modified': new Date(current.lastModified).toUTCString() },
          current.body
        )
      }

      if (method === 'PUT') {
        const ifMatch = headers['if-match']
        if (
          (headers['if-none-match'] === '*' && current !== undefined) ||
          (ifMatch !== undefined && ifMatch !== current?.etag)
        ) {
          return response(412, {}, '<Error><Code>PreconditionFailed</Code></Error>')
        }
        const etag = `"${++n}"`
        objects.set(path, { body, etag, lastModified: serverNow })
        return response(200, { etag })
      }

      if (method === 'DELETE') {
        objects.delete(path)
        return response(204)
      }

      throw new Error(`unexpected ${method} ${path}`)
    })
  })

  afterEach(() => {
    handle.restore()
    mock.timers.reset()
  })

  it('does not take over a lock the server finds fresh, even when the local clock finds it stale', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: LAST_MODIFIED + TEN_MINUTES })
    serverNow = LAST_MODIFIED + TEN_SECONDS

    await assert.rejects(createHandler()._lock('vm'), { code: 'ELOCKED' })
  })

  it('takes over a lock the server finds stale, even when the local clock finds it fresh', async () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: LAST_MODIFIED + TEN_SECONDS })
    serverNow = LAST_MODIFIED + TEN_MINUTES

    const release = await createHandler()._lock('vm')
    const lock = JSON.parse(objects.get(LOCK_PATH).body)
    assert.equal(lock.seq, 0)
    assert.match(lock.id, /^[0-9a-f]{32}$/)

    await release()
    assert.equal(objects.has(LOCK_PATH), false)
  })
})
