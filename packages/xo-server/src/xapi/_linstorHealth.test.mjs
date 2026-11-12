import assert from 'assert/strict'
import test from 'node:test'

import { getLinstorBlockingIssues, getLinstorIssues, waitLinstorHealthy } from './_linstorHealth.mjs'

const { describe, it } = test

const GENERIC_UNEXPECTED = 0x2010000
const GENERIC_LINSTOR_UNREACHABLE = 0x2010001
const NODE_NOT_ONLINE = 0x1020000
const STORAGE_POOL_LOW_FREE_SIZE = 0x1030002
const VOLUME_INVALID_STATE = 0x2040001

// what `linstor-manager` reports for a pool of 3 hosts with one resource: 2
// diskful replicas and a tie-breaker. `diskStates` are the ones of the diskful
// replicas, on host-A and host-B
const healthCheck = ({ diskStates = ['UpToDate', 'UpToDate'], errors = [], nodes } = {}) => ({
  'controller-uri': 'linstor://172.16.210.14',
  nodes: nodes ?? { 'host-A': 'ONLINE', 'host-B': 'ONLINE', 'host-C': 'ONLINE' },
  'storage-pools': {},
  resources: {
    'xcp-volume-1': {
      uuid: 'vdi-1',
      nodes: {
        'host-A': { diskful: true, 'tie-breaker': false, volumes: [{ number: 0, 'disk-state': diskStates[0] }] },
        'host-B': { diskful: true, 'tie-breaker': false, volumes: [{ number: 0, 'disk-state': diskStates[1] }] },
        'host-C': { diskful: false, 'tie-breaker': true, volumes: [] },
      },
    },
  },
  errors,
})

// the health check of `linstor-manager` up to sm 3.2.12-25.1 fails on every
// pool with at least one resource, before it looks at any volume
const BROKEN_PLUGIN_ERROR = { code: GENERIC_UNEXPECTED, message: "'volumes'" }

describe('getLinstorBlockingIssues()', function () {
  it('finds nothing on a healthy pool', function () {
    assert.deepEqual(getLinstorBlockingIssues(healthCheck()), [])
  })

  it('ignores the failure of the broken health check of the plugin', function () {
    assert.deepEqual(getLinstorBlockingIssues(healthCheck({ errors: [BROKEN_PLUGIN_ERROR] })), [])
  })

  it('finds a volume which is not up to date, even though the broken plugin does not report it', function () {
    const issues = getLinstorBlockingIssues(
      healthCheck({ diskStates: ['UpToDate', 'Inconsistent'], errors: [BROKEN_PLUGIN_ERROR] })
    )

    assert.deepEqual(issues, ['volume 0 of resource xcp-volume-1 on node host-B is Inconsistent'])
  })

  it('reports once a volume the fixed plugin reports too', function () {
    const issues = getLinstorBlockingIssues(
      healthCheck({
        diskStates: ['UpToDate', 'Inconsistent'],
        errors: [
          {
            code: VOLUME_INVALID_STATE,
            node: 'host-B',
            resource: 'xcp-volume-1',
            number: 0,
            state: 'Inconsistent',
          },
        ],
      })
    )

    assert.deepEqual(issues, ['volume 0 of resource xcp-volume-1 on node host-B is Inconsistent'])
  })

  for (const diskState of ['Created', 'Attached', 'TieBreaker']) {
    it(`accepts a ${diskState} volume`, function () {
      assert.deepEqual(getLinstorBlockingIssues(healthCheck({ diskStates: ['UpToDate', diskState] })), [])
    })
  }

  for (const diskState of ['Outdated', 'DUnknown', 'Failed', undefined]) {
    it(`refuses a volume whose state is ${diskState}`, function () {
      const issues = getLinstorBlockingIssues(healthCheck({ diskStates: ['UpToDate', diskState] }))

      assert.deepEqual(issues, [`volume 0 of resource xcp-volume-1 on node host-B is ${diskState ?? 'unknown'}`])
    })
  }

  it('accepts a diskless volume on a diskless node, refuses it on a diskful one', function () {
    const result = healthCheck()
    result.resources['xcp-volume-1'].nodes['host-C'].volumes = [{ number: 0, 'disk-state': 'Diskless' }]
    assert.deepEqual(getLinstorBlockingIssues(result), [])

    result.resources['xcp-volume-1'].nodes['host-B'].volumes = [{ number: 0, 'disk-state': 'Diskless' }]
    assert.deepEqual(getLinstorBlockingIssues(result), ['volume 0 of resource xcp-volume-1 on node host-B is Diskless'])
  })

  it('does not refuse a pool for its capacity', function () {
    const issues = getLinstorBlockingIssues(
      healthCheck({ errors: [{ code: STORAGE_POOL_LOW_FREE_SIZE, name: 'xcp-sr-linstor_group', threshold: 10 }] })
    )

    assert.deepEqual(issues, [])
  })

  it('refuses a node which is not online', function () {
    const issues = getLinstorBlockingIssues(
      healthCheck({ errors: [{ code: NODE_NOT_ONLINE, name: 'host-B', status: 'OFFLINE' }] })
    )

    assert.deepEqual(issues, ['node host-B is OFFLINE'])
  })

  it('refuses an unreachable controller', function () {
    const issues = getLinstorBlockingIssues({
      'controller-uri': '',
      nodes: {},
      'storage-pools': {},
      resources: {},
      errors: [{ code: GENERIC_LINSTOR_UNREACHABLE, message: 'No LINSTOR controller uri' }],
    })

    assert.deepEqual(issues, ['LINSTOR controller unreachable: No LINSTOR controller uri'])
  })

  it('refuses the failure of the health check when it has no resource to tell the state from', function () {
    const result = { ...healthCheck({ errors: [BROKEN_PLUGIN_ERROR] }), resources: {} }

    assert.deepEqual(getLinstorBlockingIssues(result), ["LINSTOR health check failed: 'volumes'"])
  })

  it('refuses any other failure of the health check', function () {
    const issues = getLinstorBlockingIssues(healthCheck({ errors: [{ code: GENERIC_UNEXPECTED, message: 'boom' }] }))

    assert.deepEqual(issues, ['LINSTOR health check failed: boom'])
  })

  it('relies on the volumes reported by a plugin whose resources are not listed by node', function () {
    const issues = getLinstorBlockingIssues({
      nodes: { 'host-A': 'ONLINE' },
      resources: { 'xcp-volume-1': { 'host-A': { volumes: [{ 'disk-state': 'Inconsistent' }] } } },
      errors: [
        { code: VOLUME_INVALID_STATE, node: 'host-A', resource: 'xcp-volume-1', number: 0, state: 'Inconsistent' },
      ],
    })

    assert.deepEqual(issues, ['volume 0 of resource xcp-volume-1 on node host-A is Inconsistent'])
  })
})

// Fake XAPI with one LINSTOR SR per group name, answering the health checks
// with `results` in order, the last one forever. A result which is an error is
// thrown
const fakeXapi = (results, groupNames = ['linstor_group/thin_device']) => {
  const xapi = {
    healthChecks: [],
    pool: { master: 'OpaqueRef:host-A' },
    objects: {
      indexes: {
        type: {
          SR: Object.fromEntries([
            ['OpaqueRef:sr-nfs', { type: 'nfs', $PBDs: [{ device_config: {} }] }],
            ...groupNames.map((groupName, i) => [
              `OpaqueRef:sr-${i}`,
              { type: 'linstor', $PBDs: [{ device_config: { 'group-name': groupName } }] },
            ]),
          ]),
        },
      },
    },
    async call(method, hostRef, plugin, fn, args) {
      assert.deepEqual([method, plugin, fn], ['host.call_plugin', 'linstor-manager', 'healthCheck'])
      xapi.healthChecks.push([hostRef, args])
      const result = results.length > 1 ? results.shift() : results[0]
      if (result instanceof Error) {
        throw result
      }
      return JSON.stringify(result)
    },
  }
  return xapi
}

describe('getLinstorIssues()', function () {
  it('checks every LINSTOR storage of the pool, on the master', async function () {
    const xapi = fakeXapi([healthCheck()], ['group-1', 'group-2'])

    assert.deepEqual(await getLinstorIssues(xapi), [])
    assert.deepEqual(xapi.healthChecks, [
      ['OpaqueRef:host-A', { groupName: 'group-1' }],
      ['OpaqueRef:host-A', { groupName: 'group-2' }],
    ])
  })

  it('checks once the storages sharing a group', async function () {
    const xapi = fakeXapi([healthCheck()], ['group-1', 'group-1'])

    await getLinstorIssues(xapi)

    assert.equal(xapi.healthChecks.length, 1)
  })

  it('ignores a storage attached to no host', async function () {
    const xapi = fakeXapi([healthCheck()])
    xapi.objects.indexes.type.SR['OpaqueRef:sr-0'].$PBDs = []

    assert.deepEqual(await getLinstorIssues(xapi), [])
    assert.equal(xapi.healthChecks.length, 0)
  })

  it('lets through the failure of the plugin', async function () {
    const xapi = fakeXapi([new Error('XENAPI_PLUGIN_FAILURE')])

    await assert.rejects(getLinstorIssues(xapi), { message: 'XENAPI_PLUGIN_FAILURE' })
  })
})

describe('waitLinstorHealthy()', function () {
  const UNREACHABLE = {
    nodes: {},
    resources: {},
    errors: [{ code: GENERIC_LINSTOR_UNREACHABLE, message: 'No LINSTOR controller uri' }],
  }

  it('waits for the controller to be back', async function () {
    const xapi = fakeXapi([new Error('XENAPI_PLUGIN_FAILURE'), UNREACHABLE, healthCheck()])

    await waitLinstorHealthy(xapi, { timeout: 60e3, interval: 0 })

    assert.equal(xapi.healthChecks.length, 3)
  })

  it('waits for a volume to be up to date', async function () {
    const xapi = fakeXapi([
      healthCheck({ diskStates: ['UpToDate', 'Inconsistent'] }),
      healthCheck({ diskStates: ['UpToDate', 'Inconsistent'] }),
      healthCheck(),
    ])

    await waitLinstorHealthy(xapi, { timeout: 60e3, interval: 0 })

    assert.equal(xapi.healthChecks.length, 3)
  })

  it('does not wait on a healthy pool', async function () {
    const xapi = fakeXapi([healthCheck()])

    await waitLinstorHealthy(xapi, { timeout: 0 })

    assert.equal(xapi.healthChecks.length, 1)
  })

  it('gives up on the timeout, naming the node and the resource in the way', async function () {
    const xapi = fakeXapi([
      healthCheck({
        diskStates: ['UpToDate', 'Inconsistent'],
        errors: [{ code: NODE_NOT_ONLINE, name: 'host-B', status: 'OFFLINE' }],
      }),
    ])

    await assert.rejects(waitLinstorHealthy(xapi, { timeout: 0 }), {
      message:
        'LINSTOR is not healthy after 0 seconds: node host-B is OFFLINE; volume 0 of resource xcp-volume-1 on node host-B is Inconsistent',
    })
  })

  it('gives up on the timeout with the failure of the plugin', async function () {
    const xapi = fakeXapi([new Error('XENAPI_PLUGIN_FAILURE')])

    await assert.rejects(waitLinstorHealthy(xapi, { timeout: 0 }), {
      message: 'LINSTOR is not healthy after 0 seconds: LINSTOR health check failed: XENAPI_PLUGIN_FAILURE',
    })
  })
})
