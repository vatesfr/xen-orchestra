import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { HostService } from './host.service.mjs'
import type { RestApi } from '../rest-api/rest-api.mjs'

describe('HostService.getMissingPatchesInfo', () => {
  it('counts the hosts of a disconnected pool as failed, and still reports the others', async () => {
    const hosts = {
      live: { id: 'live', $pool: 'pool-live' },
      stale: { id: 'stale', $pool: 'pool-stale', $lastSeen: Date.now() },
    }
    const queried: string[] = []
    const xapi = {
      listMissingPatches: async (hostId: string) => {
        queried.push(hostId)
        return [{ name: 'patch-1' }]
      },
    }
    const restApi = {
      getObjectsByType: () => hosts,
      xoApp: {
        checkFeatureAuthorization: async () => {},
        getXapi: (host: { $lastSeen?: number }) => {
          if (host.$lastSeen !== undefined) {
            throw new Error('the pool of this object is disconnected')
          }
          return xapi
        },
      },
    } as unknown as RestApi

    const info = await new HostService(restApi).getMissingPatchesInfo()

    assert.deepEqual(queried, ['live'])
    assert.equal(info.nHostsFailed, 1)
    assert.equal(info.nHostsWithMissingPatches, 1)
    assert.equal(info.nPoolsWithMissingPatches, 1)
    assert.deepEqual(info.missingPatches, [{ name: 'patch-1' }])
  })

  it('counts a host whose XAPI cannot be found as failed, instead of failing every pool', async () => {
    const restApi = {
      getObjectsByType: () => ({ gone: { id: 'gone', $pool: 'pool-gone' } }),
      xoApp: {
        checkFeatureAuthorization: async () => {},
        getXapi: () => {
          throw new Error('no connection found for this object')
        },
      },
    } as unknown as RestApi

    const info = await new HostService(restApi).getMissingPatchesInfo()

    assert.equal(info.nHostsFailed, 1)
    assert.deepEqual(info.missingPatches, [])
  })
})
