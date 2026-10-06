import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test'
import { strict as assert } from 'assert'

import 'dotenv/config'
import sinon from 'sinon'
import { ContainerClient } from '@azure/storage-blob'
import { getHandler } from '.'
import AzureHandler, { LEASE_DURATION, RENEW_INTERVAL, RENEW_TIMEOUT } from './azure.js'

// needs a real container, on Azure or Azurite
//
//   xo_fs_azure='azure://<account>:<key>@<host>/<container>/<dir>' yarn workspace @xen-orchestra/fs test
const url = process.env.xo_fs_azure

describe('AzureHandler#lock()', { skip: url === undefined }, () => {
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

// `AzureHandler#_lock()` against a stubbed blob client: each status code it maps is checked through the lock it takes
describe('AzureHandler#_lock with stubbed blob client', () => {
  let blob
  let leaseClient
  let getBlockBlobClientStub
  let handler

  const httpError = statusCode => Object.assign(new Error(`HTTP ${statusCode}`), { statusCode })

  // one renewal, after `RENEW_INTERVAL`
  async function renewOnce() {
    mock.timers.tick(RENEW_INTERVAL)
    await new Promise(resolve => setImmediate(resolve))
  }

  // a request which hangs until `RENEW_TIMEOUT` gives up on it
  async function timeOut() {
    mock.timers.tick(RENEW_TIMEOUT)
    await new Promise(resolve => setImmediate(resolve))
  }

  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })

    leaseClient = {
      acquireLease: sinon.stub().resolves(),
      renewLease: sinon.stub().resolves(),
    }
    blob = {
      upload: sinon.stub().resolves(),
      delete: sinon.stub().resolves(),
      getBlobLeaseClient: sinon.stub().returns(leaseClient),
    }
    getBlockBlobClientStub = sinon.stub(ContainerClient.prototype, 'getBlockBlobClient').returns(blob)

    handler = new AzureHandler({ url: 'azure://account:a2V5@account.blob.core.windows.net/container/dir' })
  })

  afterEach(() => {
    getBlockBlobClientStub.restore()
    mock.timers.reset()
  })

  it('leases the blob next to the path, under the directory of the handler, with a GUID of its own', async () => {
    const release = await handler._lock('vm')
    assert.deepEqual(getBlockBlobClientStub.firstCall.args, ['dir/vm.lock'])
    assert.match(
      blob.getBlobLeaseClient.firstCall.args[0],
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    )
    assert.deepEqual(leaseClient.acquireLease.firstCall.args, [LEASE_DURATION])
    await release()
  })

  describe('create', () => {
    // 409: the blob exists; 412: it exists and is leased
    for (const statusCode of [409, 412]) {
      it(`goes on to acquire the lease when create fails with ${statusCode}`, async () => {
        blob.upload.rejects(httpError(statusCode))

        const release = await handler._lock('vm')
        assert.deepEqual(blob.upload.firstCall.args, ['', 0, { conditions: { ifNoneMatch: '*' } }])
        assert.equal(leaseClient.acquireLease.callCount, 1)
        await release()
      })
    }

    it('rethrows an unexpected create error', async () => {
      blob.upload.rejects(httpError(500))

      await assert.rejects(handler._lock('vm'), { statusCode: 500 })
      assert.equal(leaseClient.acquireLease.callCount, 0)
    })
  })

  describe('acquire', () => {
    it('reports a lease held by another as ELOCKED', async () => {
      leaseClient.acquireLease.rejects(httpError(409))

      await assert.rejects(handler._lock('vm'), { code: 'ELOCKED' })
    })

    it('retries once when the blob is gone, then gives up as ELOCKED', async () => {
      leaseClient.acquireLease.rejects(httpError(404))

      await assert.rejects(handler._lock('vm'), { code: 'ELOCKED' })
      assert.equal(blob.upload.callCount, 2)
      assert.equal(leaseClient.acquireLease.callCount, 2)
    })

    it('takes the lock when the blob is back on the retry', async () => {
      leaseClient.acquireLease.onFirstCall().rejects(httpError(404))

      const release = await handler._lock('vm')
      assert.equal(blob.upload.callCount, 2)
      await release()
    })

    it('rethrows an unexpected acquire error', async () => {
      leaseClient.acquireLease.rejects(httpError(500))

      await assert.rejects(handler._lock('vm'), { statusCode: 500 })
    })
  })

  describe('renew', () => {
    // 404: the blob is gone; 409: it is leased to someone else. Either way the lock is taken again
    for (const statusCode of [404, 409]) {
      it(`takes the lock again when renewal fails with ${statusCode}`, async () => {
        const release = await handler._lock('vm')
        leaseClient.renewLease.rejects(httpError(statusCode))

        await renewOnce()
        assert.equal(leaseClient.renewLease.callCount, 1)
        assert.equal(leaseClient.acquireLease.callCount, 2)
        await release()
      })
    }

    it('keeps the lock and renews again when renewal fails with another error', async () => {
      const release = await handler._lock('vm')
      leaseClient.renewLease.rejects(httpError(500))

      await renewOnce()
      await renewOnce()
      assert.equal(leaseClient.renewLease.callCount, 2)
      assert.equal(leaseClient.acquireLease.callCount, 1)
      await release()
    })

    it('gives up on a renewal which hangs, and renews again', async () => {
      const release = await handler._lock('vm')
      leaseClient.renewLease.onFirstCall().returns(new Promise(() => {}))

      await renewOnce()
      await timeOut()
      await renewOnce()
      assert.equal(leaseClient.renewLease.callCount, 2)
      assert.equal(leaseClient.acquireLease.callCount, 1)
      await release()
    })

    it('gives up on a reacquisition which hangs, and renews again', async () => {
      const release = await handler._lock('vm')
      leaseClient.renewLease.onFirstCall().rejects(httpError(409))
      leaseClient.acquireLease.onSecondCall().returns(new Promise(() => {}))

      await renewOnce()
      await timeOut()
      await renewOnce()
      assert.equal(leaseClient.renewLease.callCount, 2)
      assert.equal(leaseClient.acquireLease.callCount, 2)
      await release()
    })
  })

  describe('remove', () => {
    it('deletes the blob only while the lease is ours', async () => {
      const release = await handler._lock('vm')
      await release()

      const [leaseId] = blob.getBlobLeaseClient.firstCall.args
      assert.deepEqual(blob.delete.firstCall.args, [{ conditions: { leaseId } }])
    })

    // 404: the blob is gone; 412: it is not leased to us. Both are fine, and release never rejects anyway
    for (const statusCode of [404, 412, 500]) {
      it(`releases without rejecting when delete fails with ${statusCode}`, async () => {
        const release = await handler._lock('vm')
        blob.delete.rejects(httpError(statusCode))

        await release()
        assert.equal(blob.delete.callCount, 1)
      })
    }
  })
})
