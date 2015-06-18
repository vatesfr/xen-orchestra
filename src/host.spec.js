/* eslint-env mocha */

// Doc: https://github.com/moll/js-must/blob/master/doc/API.md#must

import expect from 'must'
import eventToPromise from 'event-to-promise'
import {getConnection} from './util'
import {forEach} from 'lodash'

// ===================================================================

describe('host', function () {
  let xo
  let serverId
  before(async function () {
    this.timeout(30e3)

    xo = await getConnection()

    serverId = await xo.call('server.add', {
      host: '192.168.1.3',
      username: 'root',
      password: 'qwerty'
    }).catch(() => {})

    await eventToPromise(xo.objects, 'finish')
  })

  after(async function () {
    await xo.call('server.remove', {
      id: serverId
    })
  })

  function getAllHosts () {
    return xo.objects.indexes.type.host
  }

  function getOneHost () {
    const hosts = getAllHosts()
    for (const id in hosts) {
      return hosts[id]
    }

    throw new Error('no hosts found')
  }

// ===================================================================

  describe('.set()', function () {
    this.timeout(20e3)
    it('changes properties of the host', async function () {
      let host = getOneHost()

      await xo.call('host.set', {
        id: host.id,
        name_label: 'labTest'
      })

      // Waits for the host to be udated.
      host = await xo.waitObject(host.id)
      expect(host.name_label).to.be.equal('labTest')
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
    this.timeout(20e3)
    it('enable or disable to create VM on the host', async function () {
      let host = getOneHost()

      await xo.call('host.disable', {
        id: host.id
      })
      host = await xo.waitObject(host.id)

      expect(host.enabled).to.be.false()

      await xo.call('host.enable', {
        id: host.id
      })
      host = await xo.waitObject(host.id)

      expect(host.enabled).to.be.true()

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
      const host = getOneHost()
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
