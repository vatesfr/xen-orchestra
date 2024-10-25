/* eslint-env jest */

import { find, map } from 'lodash'

// eslint-disable-next-line n/no-missing-import
import { config, rejectionOf, xo } from './util'

// ===================================================================

describe('server', () => {
  let serverIds = []

  afterEach(async () => {
    await Promise.all(map(serverIds, serverId => xo.call('server.remove', { id: serverId })))
    serverIds = []
  })

  async function addServer(params) {
    const serverId = await xo.call('server.add', params)
    serverIds.push(serverId)
    return serverId
  }

  function getAllServers() {
    return xo.call('server.getAll')
  }

  async function getServer(id) {
    const servers = await getAllServers()
    return find(servers, { id })
  }

  // ==================================================================

  describe('.add()', () => {
    it('add a Xen server and return its id', async () => {
      const serverId = await addServer({
        host: 'xen1.example.org',
        username: 'root',
        password: 'password',
        autoConnect: false,
      })

      const server = await getServer(serverId)
      expect(typeof server.id).toBe('string')
      expect(server).toEqual({
        id: serverId,
        host: 'xen1.example.org',
        username: 'root',
        status: 'disconnected',
      })
    })

    it('does not add two servers with the same host', async () => {
      await addServer({
        host: 'xen1.example.org',
        username: 'root',
        password: 'password',
        autoConnect: false,
      })
      expect(
        (
          await rejectionOf(
            addServer({
              host: 'xen1.example.org',
              username: 'root',
              password: 'password',
              autoConnect: false,
            })
          )
        ).message
      ).toBe('unknown error from the peer')
    })

    it('set autoConnect true by default', async () => {
      const serverId = await addServer(config.xenServer1)
      const server = await getServer(serverId)

      expect(server.id).toBe(serverId)
      expect(server.host).toBe('192.168.100.3')
      expect(server.username).toBe('root')
      expect(server.status).toMatch(/^connect(?:ed|ing)$/)
    })
  })

  // -----------------------------------------------------------------

  describe('.remove()', () => {
    let serverId
    beforeEach(async () => {
      serverId = await addServer({
        host: 'xen1.example.org',
        username: 'root',
        password: 'password',
        autoConnect: false,
      })
    })

    it('remove a Xen server', async () => {
      await xo.call('server.remove', {
        id: serverId,
      })

      const server = await getServer(serverId)
      expect(server).toBeUndefined()
    })
  })

  // -----------------------------------------------------------------

  describe('.getAll()', () => {
    it('returns an array', async () => {
      const servers = await xo.call('server.getAll')

      expect(servers).toBeInstanceOf(Array)
    })
  })

  // -----------------------------------------------------------------

  describe('.set()', () => {
    let serverId
    beforeEach(async () => {
      serverId = await addServer({
        host: 'xen1.example.org',
        username: 'root',
        password: 'password',
        autoConnect: false,
      })
    })

    it('changes attributes of an existing server', async () => {
      await xo.call('server.set', {
        id: serverId,
        username: 'root2',
      })

      const server = await getServer(serverId)
      expect(server).toEqual({
        id: serverId,
        host: 'xen1.example.org',
        username: 'root2',
        status: 'disconnected',
      })
    })
  })

  // -----------------------------------------------------------------

  describe('.connect()', () => {
    jest.setTimeout(5e3)

    it('connects to a Xen server', async () => {
      const serverId = await addServer(Object.assign({ autoConnect: false }, config.xenServer1))

      await xo.call('server.connect', {
        id: serverId,
      })

      const server = await getServer(serverId)
      expect(server).toEqual({
        enabled: 'true',
        id: serverId,
        host: '192.168.100.3',
        username: 'root',
        status: 'connected',
      })
    })

    it.skip('connect to a Xen server on a slave host', async () => {
      const serverId = await addServer(config.slaveServer)
      await xo.call('server.connect', { id: serverId })

      const server = await getServer(serverId)
      expect(server.status).toBe('connected')
    })
  })

  // -----------------------------------------------------------------

  describe('.disconnect()', () => {
    jest.setTimeout(5e3)
    let serverId
    beforeEach(async () => {
      serverId = await addServer(Object.assign({ autoConnect: false }, config.xenServer1))
      await xo.call('server.connect', {
        id: serverId,
      })
    })

    it('disconnects to a Xen server', async () => {
      await xo.call('server.disconnect', {
        id: serverId,
      })

      const server = await getServer(serverId)
      expect(server).toEqual({
        id: serverId,
        host: '192.168.100.3',
        username: 'root',
        status: 'disconnected',
      })
    })
  })
})
