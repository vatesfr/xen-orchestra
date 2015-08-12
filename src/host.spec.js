/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must

import expect from 'must'
import eventToPromise from 'event-to-promise'
import {getAllHosts, getConfig, getMainConnection, getVmToMigrateId, waitObjectState} from './util'
import {find, forEach} from 'lodash'

// ===================================================================

describe('host', function () {
  let xo
  let serverId
  let hostId

  // -----------------------------------------------------------------

  before(async function () {
    this.timeout(10e3)
    let config
    ;[xo, config] = await Promise.all([
      getMainConnection(),
      getConfig()
    ])
    serverId = await xo.call('server.add', config.xenServer2).catch(() => {})
    await eventToPromise(xo.objects, 'finish')

    hostId = getHost(config.host1)
  })

  // -------------------------------------------------------------------

  after(async function () {
    await xo.call('server.remove', {
      id: serverId
    })
  })

  // -------------------------------------------------------------------

  function getHost (name_label) {
    const hosts = getAllHosts(xo)
    const host = find(hosts, {name_label: name_label})
    return host.id
  }

// ===================================================================

  describe('.set()', function () {
    let name_label
    let name_description

    beforeEach(async function () {
      // get values to set them at the end of the test
      const host = xo.objects.all[hostId]
      name_label = host.name_label
      name_description = host.name_description
    })
    afterEach(async function () {
      await xo.call('host.set', {
        id: hostId,
        name_label: name_label,
        name_description: name_description
      })
    })

    it('changes properties of the host', async function () {
      await xo.call('host.set', {
        id: hostId,
        name_label: 'labTest',
        name_description: 'description'
      })
      await waitObjectState(xo, hostId, host => {
        expect(host.name_label).to.be.equal('labTest')
        expect(host.name_description).to.be.equal('description')
      })
    })
  })

  // ------------------------------------------------------------------

  describe('.restart()', function () {
    this.timeout(330e3)
    it('restart the host', async function () {
      await xo.call('host.restart', {id: hostId})

      await waitObjectState(xo, hostId, host => {
        expect(host.current_operations)
      })
      await waitObjectState(xo, hostId, host => {
        expect(host.power_state).to.be.equal('Halted')
      })
      await waitObjectState(xo, hostId, host => {
        expect(host.power_state).to.be.equal('Running')
      })
    })
  })

  // ------------------------------------------------------------------

  describe('.restartAgent()', function () {
    it('restart a Xen agent on the host')
  })

  // ------------------------------------------------------------------

  describe('.start()', function () {
    this.timeout(300e3)
    beforeEach(async function () {
      try {
        await xo.call('host.stop', {id: hostId})
      } catch(_) {}

      // test if the host is shutdown
      await waitObjectState(xo, hostId, host => {
        expect(host.power_state).to.be.equal('Halted')
      })
    })

    it('start the host', async function () {
      await xo.call('host.start', {id: hostId})
      await waitObjectState(xo, hostId, host => {
        expect(host.power_state).to.be.equal('Running')
      })
    })
  })

  // ------------------------------------------------------------------

  describe('.stop()', function () {
    this.timeout(300e3)
    let vmId

    before(async function () {
      vmId = await getVmToMigrateId(xo)
      try {
        await xo.call('vm.start', {id: vmId})
      } catch(_) {}
      try {
        await xo.call('vm.migrate', {
          vm: vmId,
          host: hostId
        })
      } catch(_) {}
    })
    afterEach(async function () {
      await xo.call('host.start', {id: hostId})
    })

    it('stop the host and shutdown its VMs', async function () {
      await xo.call('host.stop', {id: hostId})
      await Promise.all([
        waitObjectState(xo, vmId, vm => {
          expect(vm.$container).not.to.be.equal(hostId)
          expect(vm.power_state).to.be.equal('Halted')
        }),
        waitObjectState(xo, hostId, host => {
          expect(host.power_state).to.be.equal('Halted')
        })
      ])
    })
  })

  // ------------------------------------------------------------------

  describe('.detach()', function () {
    it('ejects the host of a pool')
  })

  // ------------------------------------------------------------------

  describe('.disable(), ', function () {
    afterEach(async function () {
      await xo.call('host.enable', {
        id: hostId
      })
    })

    it('disables to create VM on the host', async function () {
      await xo.call('host.disable', {id: hostId})
      await waitObjectState(xo, hostId, host => {
        expect(host.enabled).to.be.false()
      })
    })
  })

  // ------------------------------------------------------------------

  describe('.enable()', async function () {
    beforeEach(async function () {
      await xo.call('host.disable', {id: hostId})
    })

    it('enables to create VM on the host', async function () {
      await xo.call('host.enable', {id: hostId})

      await waitObjectState(xo, hostId, host => {
        expect(host.enabled).to.be.true()
      })
    })
  })

  // -----------------------------------------------------------------
  describe('.createNetwork()', function () {
    it('create a network')
  })

  // -----------------------------------------------------------------

  describe('.listMissingPatches()', function () {
    it('returns an array of missing patches in the host')
    it('returns a empty array if up-to-date')
  })

  // ------------------------------------------------------------------

  describe('.installPatch()', function () {
    it('installs a patch patch on the host')
  })

  // ------------------------------------------------------------------

  describe('.stats()', function () {
    it('returns an array with statistics of the host', async function () {
      const stats = await xo.call('host.stats', {
        host: hostId
      })
      expect(stats).to.be.an.object()

      forEach(stats, function (array, key) {
        expect(array).to.be.an.array()
      })
    })
  })
})
