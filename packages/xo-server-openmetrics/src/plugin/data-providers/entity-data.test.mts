/**
 * Unit tests for the entity data providers.
 *
 * Each test builds a minimal fake `XoApp` whose `getObjects({ filter: { type } })`
 * returns per-type fixture maps, drives one provider, and asserts the shaped
 * IPC payload. These providers were extracted verbatim from `OpenMetricsPlugin`
 * in commit 6; the tests pin the transformation so future moves cannot drift.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { XoApp } from '@vates/types'

import {
  getHostStatusData,
  getSrData,
  getVdiData,
  getVmStatusData,
  getXapiCredentials,
  getXoMetrics,
} from './entity-data.mjs'
import { EluSampler } from '../elu-sampler.mjs'

// ----------------------------------------------------------------------------
// Fake XoApp helpers
// ----------------------------------------------------------------------------

type ObjectsByType = Partial<Record<string, Record<string, unknown>>>

/**
 * Build a fake `XoApp` that answers `getObjects({ filter: { type } })` from a
 * per-type fixture map and `getAllXapis()` from the supplied record.
 */
function fakeXo(objectsByType: ObjectsByType, xapis: Record<string, unknown> = {}): XoApp {
  return {
    getObjects(opts?: { filter?: Record<string, unknown> }) {
      const type = opts?.filter?.type as string | undefined
      if (type === undefined) {
        // Merge every type for the no-filter callers.
        return Object.assign({}, ...Object.values(objectsByType))
      }
      return objectsByType[type] ?? {}
    },
    getAllXapis() {
      return xapis
    },
  } as unknown as XoApp
}

// ----------------------------------------------------------------------------
// getXapiCredentials
// ----------------------------------------------------------------------------

describe('getXapiCredentials', () => {
  it('returns one host-credentials entry per host with a connected pool session', () => {
    const xapis = {
      server1: {
        status: 'connected',
        pool: { uuid: 'pool-1' },
        sessionId: 'session-abc',
        _url: { protocol: 'https:' },
      },
    }
    const xo = fakeXo(
      {
        pool: { 'pool-1': { uuid: 'pool-1', name_label: 'Pool One', type: 'pool' } },
        host: {
          'host-1': {
            uuid: 'host-1',
            address: '10.0.0.1',
            name_label: 'Host One',
            $poolId: 'pool-1',
            type: 'host',
          },
        },
      },
      xapis
    )

    const result = getXapiCredentials(xo)

    assert.equal(result.hosts.length, 1)
    assert.deepEqual(result.hosts[0], {
      hostId: 'host-1',
      hostAddress: '10.0.0.1',
      hostLabel: 'Host One',
      poolId: 'pool-1',
      poolLabel: 'Pool One',
      sessionId: 'session-abc',
      protocol: 'https:',
    })
    // labels is produced by getLabelLookupData; just assert the shape is present.
    assert.ok(result.labels.vms !== undefined)
    assert.ok(result.labels.srs !== undefined)
  })

  it('skips hosts whose pool has no connected session', () => {
    const xapis = {
      server1: { status: 'disconnected', pool: { uuid: 'pool-1' }, sessionId: 's', _url: { protocol: 'https:' } },
    }
    const xo = fakeXo(
      {
        pool: { 'pool-1': { uuid: 'pool-1', name_label: 'Pool One', type: 'pool' } },
        host: { 'host-1': { uuid: 'host-1', address: '10.0.0.1', name_label: 'H1', $poolId: 'pool-1', type: 'host' } },
      },
      xapis
    )

    const result = getXapiCredentials(xo)

    assert.equal(result.hosts.length, 0)
  })
})

// ----------------------------------------------------------------------------
// getSrData
// ----------------------------------------------------------------------------

describe('getSrData', () => {
  it('shapes shared SR data with pool name and no host fields', () => {
    const xo = fakeXo({
      pool: { 'pool-1': { uuid: 'pool-1', name_label: 'Pool One', type: 'pool' } },
      host: {},
      SR: {
        'sr-1': {
          uuid: 'sr-1',
          name_label: 'Shared SR',
          $poolId: 'pool-1',
          SR_type: 'nfs',
          size: 1000,
          physical_usage: 400,
          usage: 600,
          shared: true,
          $container: 'pool-1',
          type: 'SR',
        },
      },
    })

    const { srs } = getSrData(xo)

    assert.equal(srs.length, 1)
    assert.deepEqual(srs[0], {
      uuid: 'sr-1',
      name_label: 'Shared SR',
      pool_id: 'pool-1',
      pool_name: 'Pool One',
      sr_type: 'nfs',
      size: 1000,
      physical_usage: 400,
      usage: 600,
    })
  })

  it('adds host_id/host_name for a local (non-shared) SR', () => {
    const xo = fakeXo({
      pool: { 'pool-1': { uuid: 'pool-1', name_label: 'Pool One', type: 'pool' } },
      host: { 'host-1': { id: 'host-1', name_label: 'Host One', type: 'host' } },
      SR: {
        'sr-2': {
          uuid: 'sr-2',
          name_label: 'Local SR',
          $poolId: 'pool-1',
          SR_type: 'lvm',
          size: 500,
          physical_usage: 100,
          usage: 100,
          shared: false,
          $container: 'host-1',
          type: 'SR',
        },
      },
    })

    const { srs } = getSrData(xo)

    assert.equal(srs[0]!.host_id, 'host-1')
    assert.equal(srs[0]!.host_name, 'Host One')
  })
})

// ----------------------------------------------------------------------------
// getVdiData
// ----------------------------------------------------------------------------

describe('getVdiData', () => {
  it('resolves SR and attached VM via VBDs', () => {
    const xo = fakeXo({
      pool: { 'pool-1': { uuid: 'pool-1', name_label: 'Pool One', type: 'pool' } },
      SR: { 'sr-1': { uuid: 'sr-1', name_label: 'SR One', SR_type: 'nfs', $poolId: 'pool-1', type: 'SR' } },
      VBD: { 'vbd-1': { VM: 'vm-1', type: 'VBD' } },
      VM: { 'vm-1': { id: 'vm-1', uuid: 'vm-uuid-1', name_label: 'VM One', type: 'VM' } },
      VDI: {
        'vdi-1': {
          uuid: 'vdi-1',
          name_label: 'Disk 1',
          size: 2048,
          usage: 1024,
          $SR: 'sr-1',
          $VBDs: ['vbd-1'],
          type: 'VDI',
        },
      },
    })

    const { vdis } = getVdiData(xo)

    assert.equal(vdis.length, 1)
    assert.deepEqual(vdis[0], {
      uuid: 'vdi-1',
      name_label: 'Disk 1',
      size: 2048,
      usage: 1024,
      sr_uuid: 'sr-1',
      sr_name: 'SR One',
      sr_type: 'nfs',
      pool_id: 'pool-1',
      pool_name: 'Pool One',
      vm_uuid: 'vm-uuid-1',
      vm_name: 'VM One',
    })
  })

  it('skips VDIs whose SR is missing', () => {
    const xo = fakeXo({
      pool: {},
      SR: {},
      VBD: {},
      VM: {},
      VDI: {
        'vdi-x': { uuid: 'vdi-x', name_label: 'orphan', size: 1, usage: 0, $SR: 'sr-missing', $VBDs: [], type: 'VDI' },
      },
    })

    const { vdis } = getVdiData(xo)

    assert.equal(vdis.length, 0)
  })
})

// ----------------------------------------------------------------------------
// getHostStatusData / getVmStatusData
// ----------------------------------------------------------------------------

describe('getHostStatusData', () => {
  it('returns power_state and enabled for every host', () => {
    const xo = fakeXo({
      pool: { 'pool-1': { uuid: 'pool-1', name_label: 'Pool One', type: 'pool' } },
      host: {
        'host-1': {
          uuid: 'host-1',
          name_label: 'Host One',
          power_state: 'Running',
          enabled: true,
          $poolId: 'pool-1',
          type: 'host',
        },
      },
    })

    const { hosts } = getHostStatusData(xo)

    assert.deepEqual(hosts[0], {
      uuid: 'host-1',
      name_label: 'Host One',
      power_state: 'Running',
      enabled: true,
      pool_id: 'pool-1',
      pool_name: 'Pool One',
    })
  })
})

describe('getVmStatusData', () => {
  it('returns power_state for every VM', () => {
    const xo = fakeXo({
      pool: { 'pool-1': { uuid: 'pool-1', name_label: 'Pool One', type: 'pool' } },
      VM: {
        'vm-1': { uuid: 'vm-1', name_label: 'VM One', power_state: 'Halted', $poolId: 'pool-1', type: 'VM' },
      },
    })

    const { vms } = getVmStatusData(xo)

    assert.deepEqual(vms[0], {
      uuid: 'vm-1',
      name_label: 'VM One',
      power_state: 'Halted',
      pool_id: 'pool-1',
      pool_name: 'Pool One',
    })
  })
})

// ----------------------------------------------------------------------------
// getXoMetrics
// ----------------------------------------------------------------------------

describe('getXoMetrics', () => {
  it('aggregates object counts, user/group/job stats and the nodeProcess block', async () => {
    const allObjects = {
      'pool-1': { type: 'pool' },
      'host-1': {
        type: 'host',
        cpus: { sockets: 2 },
        productBrand: 'XCP-ng',
        version: '8.3',
        license_params: { sku_type: 'xcpng' },
      },
      'vm-1': { type: 'VM' },
      'vm-2': { type: 'VM' },
      'sr-1': { type: 'SR', content_type: 'user' },
    }

    async function* taskGen() {
      yield { status: 'pending' }
      yield { status: 'pending' }
    }

    const xo = {
      getObjects() {
        return allObjects
      },
      tasks: { list: () => taskGen() },
      getAllUsers: async () => [{}, {}, {}],
      getAllGroups: async () => [{}],
      getAllJobs: async () => [{ key: 'backup' }, { key: 'backup' }, { key: 'genericTask' }],
    } as unknown as XoApp

    const result = await getXoMetrics(xo, new EluSampler())

    assert.equal(result.poolCount, 1)
    assert.equal(result.hostCount, 1)
    assert.equal(result.vmCount, 2)
    assert.equal(result.socketCount, 2)
    assert.equal(result.pendingTaskCount, 2)
    assert.equal(result.userCount, 3)
    assert.equal(result.groupCount, 1)
    assert.deepEqual(result.srCountByContentType, { user: 1 })
    assert.deepEqual(result.hostCountByVersion, [{ productBrand: 'XCP-ng', version: '8.3', count: 1 }])
    assert.deepEqual(result.hostCountByLicense, [{ skuType: 'xcpng', count: 1 }])
    // genericTask is excluded; only the 'backup' key is counted.
    assert.deepEqual(result.backupJobStats, [{ type: 'backup', jobCount: 2 }])
    // nodeProcess is always present; no ELU samples accumulated yet → zeros.
    assert.equal(result.nodeProcess.eluMean, 0)
    assert.ok(result.nodeProcess.memoryRssBytes > 0)
    assert.ok(result.nodeProcess.heapSizeLimitBytes > 0)
  })
})
