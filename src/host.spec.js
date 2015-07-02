/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must

import expect from 'must'
import eventToPromise from 'event-to-promise'
import {getConnection, getConfig, getOneHost, waitObjectState} from './util'
import {forEach} from 'lodash'

// ===================================================================

describe('host', function () {
  let xo
  let serverId
  let host

  // -----------------------------------------------------------------

  before(async function () {
    this.timeout(30e3)

    xo = await getConnection()

    const config = await getConfig()
    serverId = await xo.call('server.add', config.xenServer1).catch(() => {})

    await eventToPromise(xo.objects, 'finish')
  })

  // -------------------------------------------------------------------

  beforeEach(async function () {
    host = getOneHost(xo)
  })

  // -------------------------------------------------------------------

  after(async function () {
    await xo.call('server.remove', {
      id: serverId
    })
  })

// ===================================================================

  describe('.set()', function () {
    it('changes properties of the host', async function () {
      await xo.call('host.set', {
        id: host.id,
        name_label: 'labTest'
      })
      await waitObjectState(xo, host.id, host => {
        expect(host.name_label).to.be.equal('labTest')
      })
    })
  })

  // ------------------------------------------------------------------

  describe('.restart()', function () {
    it('restart the host')
  })

  // ------------------------------------------------------------------

  describe('.restartAgent()', function () {
    it('restart a Xen agent on the host')
  })

  // ------------------------------------------------------------------

  describe('.start()', function () {
    it('start the host')
  })

  // ------------------------------------------------------------------

  describe('.stop()', function () {
    it('stop the host')
  })

  // ------------------------------------------------------------------

  describe('.detach()', function () {
    it('ejects the host of a pool')
  })

  // ------------------------------------------------------------------

  describe('.disable(), .enable()', function () {
    it('enable or disable to create VM on the host', async function () {
      await xo.call('host.disable', {
        id: host.id
      })
      await waitObjectState(xo, host.id, host => {
        expect(host.enabled).to.be.false()
      })

      await xo.call('host.enable', {
        id: host.id
      })

      await waitObjectState(xo, host.id, host => {
        expect(host.enabled).to.be.true()
      })
    })
  })

  // ------------------------------------------------------------------

  describe('.listMissingPatches()', function () {
    it('returns an array of missing patches in the host')
    it('returns a empty arry if up-to-date')
  })

  // ------------------------------------------------------------------

  describe('.installPatch()', function () {
    it('installs a patch patch on the host')
  })

  // ------------------------------------------------------------------

  describe('.stats()', function () {
    it('returns an array with statistics of the host', async function () {
      const stats = await xo.call('host.stats', {
        host: host.id
      })
      expect(stats).to.be.an.object()

      forEach(stats, function (array, key) {
        expect(array).to.be.an.array()
      })
    })
  })
})
