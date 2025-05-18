/* eslint-env jest */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must

// eslint-disable-next-line n/no-missing-import
import expect from 'must'
import fromEvent from 'promise-toolbox/fromEvent'
// eslint-disable-next-line n/no-missing-import
import { getAllHosts, getConfig, getMainConnection, getVmToMigrateId, waitObjectState } from './util'
import { find, forEach } from 'lodash'

// ===================================================================

describe('host', () => {
  let xo
  let serverId
  let hostId

  // -----------------------------------------------------------------

  beforeAll(async () => {
    jest.setTimeout(10e3)
    let config
    ;[xo, config] = await Promise.all([getMainConnection(), getConfig()])
    serverId = await xo.call('server.add', config.xenServer2).catch(() => {})
    await fromEvent(xo.objects, 'finish')

    hostId = getHost(config.host1)
  })

  // -------------------------------------------------------------------

  afterAll(async () => {
    await xo.call('server.remove', {
      id: serverId,
    })
  })

  // -------------------------------------------------------------------

  function getHost(nameLabel) {
    const hosts = getAllHosts(xo)
    const host = find(hosts, { name_label: nameLabel })
    return host.id
  }

  // ===================================================================

  describe('.set()', () => {
    let nameLabel
    let nameDescription

    beforeEach(async () => {
      // get values to set them at the end of the test
      const host = xo.objects.all[hostId]
      nameLabel = host.name_label
      nameDescription = host.name_description
    })
    afterEach(async () => {
      await xo.call('host.set', {
        id: hostId,
        name_label: nameLabel,
        name_description: nameDescription,
      })
    })

    it('changes properties of the host', async () => {
      await xo.call('host.set', {
        id: hostId,
        name_label: 'labTest',
        name_description: 'description',
      })
      await waitObjectState(xo, hostId, host => {
        expect(host.name_label).to.be.equal('labTest')
        expect(host.name_description).to.be.equal('description')
      })
    })
  })

  // ------------------------------------------------------------------

  describe('.restart()', () => {
    jest.setTimeout(330e3)
    it('restart the host', async () => {
      await xo.call('host.restart', { id: hostId })

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

  describe('.restartAgent()', () => {
    it('restart a Xen agent on the host')
  })

  // ------------------------------------------------------------------

  describe('.start()', () => {
    jest.setTimeout(300e3)
    beforeEach(async () => {
      try {
        await xo.call('host.stop', { id: hostId })
      } catch (_) {}

      // test if the host is shutdown
      await waitObjectState(xo, hostId, host => {
        expect(host.power_state).to.be.equal('Halted')
      })
    })

    it('start the host', async () => {
      await xo.call('host.start', { id: hostId })
      await waitObjectState(xo, hostId, host => {
        expect(host.power_state).to.be.equal('Running')
      })
    })
  })

  // ------------------------------------------------------------------

  describe('.stop()', () => {
    jest.setTimeout(300e3)
    let vmId

    beforeAll(async () => {
      vmId = await getVmToMigrateId(xo)
      try {
        await xo.call('vm.start', { id: vmId })
      } catch (_) {}
      try {
        await xo.call('vm.migrate', {
          vm: vmId,
          host: hostId,
        })
      } catch (_) {}
    })
    afterEach(async () => {
      await xo.call('host.start', { id: hostId })
    })

    it('stop the host and shutdown its VMs', async () => {
      await xo.call('host.stop', { id: hostId })
      await Promise.all([
        waitObjectState(xo, vmId, vm => {
          expect(vm.$container).not.to.be.equal(hostId)
          expect(vm.power_state).to.be.equal('Halted')
        }),
        waitObjectState(xo, hostId, host => {
          expect(host.power_state).to.be.equal('Halted')
        }),
      ])
    })
  })

  // ------------------------------------------------------------------

  describe('.detach()', () => {
    it('ejects the host of a pool')
  })

  // ------------------------------------------------------------------

  describe('.disable(), ', () => {
    afterEach(async () => {
      await xo.call('host.enable', {
        id: hostId,
      })
    })

    it('disables to create VM on the host', async () => {
      await xo.call('host.disable', { id: hostId })
      await waitObjectState(xo, hostId, host => {
        expect(host.enabled).to.be.false()
      })
    })
  })

  // ------------------------------------------------------------------

  describe('.enable()', async () => {
    beforeEach(async () => {
      await xo.call('host.disable', { id: hostId })
    })

    it('enables to create VM on the host', async () => {
      await xo.call('host.enable', { id: hostId })

      await waitObjectState(xo, hostId, host => {
        expect(host.enabled).to.be.true()
      })
    })
  })

  // -----------------------------------------------------------------
  describe('.createNetwork()', () => {
    it('create a network')
  })

  // -----------------------------------------------------------------

  describe('.listMissingPatches()', () => {
    it('returns an array of missing patches in the host')
    it('returns a empty array if up-to-date')
  })

  // ------------------------------------------------------------------

  describe('.installPatch()', () => {
    it('installs a patch on the host')
  })

  // ------------------------------------------------------------------

  describe('.stats()', () => {
    it('returns an array with statistics of the host', async () => {
      const stats = await xo.call('host.stats', {
        host: hostId,
      })
      expect(stats).to.be.an.object()

      forEach(stats, function (array, key) {
        expect(array).to.be.an.array()
      })
    })
  })
})
