import assert from 'assert/strict'
import test from 'node:test'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import { incorrectState } from 'xo-common/api-errors.js'

import patchingMethods from './patching.mjs'

const { describe, it } = test

// Fake XAPI modelling an XCP-ng pool with only what the start of a rolling
// pool update depends on: which hosts have missing patches. The first host is
// the master.
class FakeXapi {
  constructor(nMissingPatchesByHost) {
    this.hosts = nMissingPatchesByHost.map((nMissingPatches, i) => {
      const letter = String.fromCharCode(65 + i)
      return {
        $type: 'host',
        $ref: `OpaqueRef:host-${letter}`,
        uuid: `host-${letter}`,
        name_label: `host ${letter}`,
        software_version: { product_brand: 'XCP-ng', product_version: '8.3.0' },
        nMissingPatches,
      }
    })
    this.objects = {
      indexes: { type: { host: Object.fromEntries(this.hosts.map(host => [host.$ref, host])), SR: {}, VM: {} } },
    }
    this.pool = { uuid: 'pool-1', $master: this.hosts[0] }

    // hosts handled by each rolling pool reboot, ie not ignored
    this.rebootedHosts = []
  }

  async listMissingPatches(hostUuid) {
    const { nMissingPatches } = this.hosts.find(host => host.uuid === hostUuid)
    return Array.from({ length: nMissingPatches }, (_, i) => ({ name: `patch-${i}` }))
  }

  async rollingPoolReboot(parentTask, { ignoreHost }) {
    this.rebootedHosts.push(this.hosts.filter(host => !ignoreHost(host)).map(host => host.uuid))
  }
}

// the mixin reaches its own methods through `this`
Object.setPrototypeOf(FakeXapi.prototype, patchingMethods)

const rollingPoolUpdate = async (xapi, options) => {
  const parentTask = new Task({ properties: { name: 'rolling pool update', progress: 0 } })

  let error
  await parentTask.run(async () => {
    try {
      await patchingMethods.rollingPoolUpdate.call(xapi, parentTask, options)
    } catch (err) {
      error = err
    }
  })
  return error
}

describe('rollingPoolUpdate', function () {
  it('refuses a pool whose master is current while another host is not', async function () {
    const xapi = new FakeXapi([0, 2, 0])

    const error = await rollingPoolUpdate(xapi)

    assert.ok(incorrectState.is(error, { property: 'partiallyUpdatedPool' }), error)
    assert.deepEqual(error.data.actual, ['host-B'])
    assert.equal(error.data.object, 'pool-1')
    assert.deepEqual(xapi.rebootedHosts, [])
  })

  it('updates the outdated hosts once the current state is accepted as the baseline', async function () {
    const xapi = new FakeXapi([0, 2, 0])

    const error = await rollingPoolUpdate(xapi, { acceptCurrentStateAsBaseline: true })

    assert.equal(error, undefined)
    assert.deepEqual(xapi.rebootedHosts, [['host-B']])
  })

  it('needs no acknowledgement when the master is outdated too', async function () {
    const xapi = new FakeXapi([1, 2, 0])

    const error = await rollingPoolUpdate(xapi)

    assert.equal(error, undefined)
    assert.deepEqual(xapi.rebootedHosts, [['host-A', 'host-B']])
  })
})
