import { address } from 'ip'
import createLogger from '@xen-orchestra/log'
import { createServer } from 'tls'
import { filter, find, forOwn, map } from 'lodash'
import fromEvent from 'promise-toolbox/fromEvent'
import { OvsdbClient } from './ovsdb-client'
import { readFileSync } from 'fs'

const log = createLogger('xo:xo-server:sdn-controller')

const PROTOCOL = 'ssl'
const OVSDB_PORT = 6640

exports.configurationSchema = {
  type: 'object',
  properties: {
    'cert-dir': {
      description:
        'Full path to a directory where to find: server-cert.pem, server-key.pem and ca-cert.pem to create ssl connections with hosts.',
      type: 'string',
    },
  },
}

// =============================================================================

class SDNController {
  constructor({ xo }) {
    this._xo = xo

    this._ip = address()

    this._server = null

    this._certDirectory = null

    this._poolNetworks = []
    this._OvsdbClients = []
    this._newHosts = []

    this._networks = new Map()
    this._starCenters = new Map()

    this._cleaners = []
    this._objectsAdded = this._objectsAdded.bind(this)
    this._objectsUpdated = this._objectsUpdated.bind(this)
  }

  // ---------------------------------------------------------------------------

  configure(configuration) {
    this._certDirectory = configuration['cert-dir']
  }

  async load() {
    const options = {
      key: readFileSync(this._certDirectory + '/server-key.pem'),
      cert: readFileSync(this._certDirectory + '/server-cert.pem'),
      ca: [readFileSync(this._certDirectory + '/ca-cert.pem')],

      requestCert: false,
      rejectUnauthorized: false,
    }
    this._server = createServer(options, socket => {
      const remoteAddress = socket.remoteAddress.startsWith('::ffff:')
        ? socket.remoteAddress.substring(7) // Fake IPv6 => IPv4
        : socket.remoteAddress

      const client = find(this._OvsdbClients, {
        address: remoteAddress,
      })
      if (!client) {
        log.error(`Reject connection from unknown remote: ${remoteAddress}`)
        socket.destroy()
        return
      }

      log.debug(`[${client._host.name_label}] New socket`)

      socket.on('error', error => {
        log.error(
          `[${
            client._host.name_label
          }] OVSDB client socket error: ${error} with code: ${error.code}`
        )
      })
      socket.on('end', () => {
        log.error(`[${client._host.name_label}] OVSDB client socket ended`)
      })

      client.socket = socket
    })
    this._server.listen(OVSDB_PORT, () => {
      log.debug(`Server listening port: ${OVSDB_PORT}`)
    })

    // FIXME: we should monitor when xapis are added/removed
    forOwn(this._xo.getAllXapis(), async xapi => {
      await xapi.objectsFetched

      if (!this._setControllerNeeded(xapi)) {
        this._cleaners.push(this._monitorXapi(xapi))

        const hosts = filter(xapi.objects.all, { $type: 'host' })
        await Promise.all(
          map(hosts, async host => {
            await this._createOvsdbClient(host)
          })
        )

        // Add already existing pool-wide private networks
        const networks = filter(xapi.objects.all, { $type: 'network' })
        forOwn(networks, async network => {
          if (network.other_config.private_pool_wide === 'true') {
            log.debug(
              `Adding network: '${network.name_label}' for pool: '${
                network.$pool.name_label
              }' to managed networks`
            )
            const center = await this._electNewCenter(network, true)
            this._poolNetworks.push({
              pool: network.$pool.$ref,
              network: network.$ref,
              starCenter: center ? center.$ref : null,
            })
            this._networks.set(network.$id, network.$ref)
            if (center) {
              this._starCenters.set(center.$id, center.$ref)
            }
          }
        })
      }

      // TODO: Remove me when UI allows the creation
      /*
      this.createPrivateNetwork(
        xapi.pool,
        `Private network ${xapi.pool.name_label}`
      )
*/
    })
  }

  async unload() {
    this._OvsdbClients.forEach(client => {
      client.socket = null
    })

    this._OvsdbClients = []
    this._poolNetworks = []
    this._newHosts = []

    this._networks.clear()
    this._starCenters.clear()

    this._cleaners.forEach(cleaner => cleaner())
    this._cleaners = []

    this._server.close()
  }

  // ---------------------------------------------------------------------------

  async createPrivateNetwork(pool, networkName) {
    await this._setPoolControllerIfNeeded(pool)

    // Create the private network
    const privateNetworkRef = await pool.$xapi.call('network.create', {
      name_label: networkName,
      name_description: 'Private network created by XO SDN controller',
      MTU: 0,
      other_config: {
        automatic: 'false',
        private_pool_wide: 'true',
      },
    })

    const privateNetwork = await pool.$xapi._getOrWaitObject(privateNetworkRef)

    log.info(
      `Private network '${
        privateNetwork.name_label
      }' has been created for pool '${pool.name_label}'`
    )

    // For each pool's host, create a tunnel to the private network
    const hosts = filter(pool.$xapi.objects.all, { $type: 'host' })
    await Promise.all(
      map(hosts, async host => {
        await this._createTunnel(host, privateNetwork)
        await this._createOvsdbClient(host)
      })
    )

    const center = await this._electNewCenter(privateNetwork, false)
    this._poolNetworks.push({
      pool: pool.$ref,
      network: privateNetwork.$ref,
      starCenter: center ? center.$ref : null,
    })
    this._networks.set(privateNetwork.$id, privateNetwork.$ref)
    if (center) {
      this._starCenters.set(center.$id, center.$ref)
    }
  }

  // ===========================================================================

  _monitorXapi(xapi) {
    const { objects } = xapi

    const objectsRemovedXapi = this._objectsRemoved.bind(this, xapi)
    objects.on('add', this._objectsAdded)
    objects.on('update', this._objectsUpdated)
    objects.on('remove', objectsRemovedXapi)

    return () => {
      objects.removeListener('add', this._objectsAdded)
      objects.removeListener('update', this._objectsUpdated)
      objects.removeListener('remove', objectsRemovedXapi)
    }
  }

  async _objectsAdded(objects) {
    await Promise.all(
      map(objects, async object => {
        const { $type } = object

        if ($type === 'host') {
          log.debug(
            `New host: '${object.name_label}' in pool: '${
              object.$pool.name_label
            }'`
          )

          if (!find(this._newHosts, { $ref: object.$ref })) {
            this._newHosts.push(object)
          }
          await this._createOvsdbClient(object)
        }
      })
    )
  }

  async _objectsUpdated(objects) {
    await Promise.all(
      map(objects, async (object, id) => {
        const { $type } = object

        if ($type === 'PIF') {
          await this._pifUpdated(object)
        } else if ($type === 'host') {
          await this._hostUpdated(object)
        }
      })
    )
  }

  async _objectsRemoved(xapi, objects) {
    await Promise.all(
      map(objects, async (object, id) => {
        const client = find(this._OvsdbClients, { id: id })
        if (client) {
          client.socket = null
          this._OvsdbClients.splice(this._OvsdbClients.indexOf(client), 1)
        }

        // If a Star center host is removed: re-elect a new center where needed
        const starCenterRef = this._starCenters.get(id)
        if (starCenterRef) {
          this._starCenters.delete(id)
          const poolNetworks = filter(this._poolNetworks, {
            starCenter: starCenterRef,
          })
          let i
          for (i = 0; i < poolNetworks.length; ++i) {
            const poolNetwork = poolNetworks[i]
            const network = await xapi._getOrWaitObject(poolNetwork.network)
            const newCenter = await this._electNewCenter(network, true)
            poolNetwork.starCenter = newCenter ? newCenter.$ref : null
            if (newCenter) {
              this._starCenters.set(newCenter.$id, newCenter.$ref)
            }
          }
          return
        }

        // If a network is removed, clean this._poolNetworks from it
        const networkRef = this._networks.get(id)
        if (networkRef) {
          this._networks.delete(id)
          const poolNetwork = find(this._poolNetworks, {
            network: networkRef,
          })
          if (poolNetwork) {
            this._poolNetworks.splice(
              this._poolNetworks.indexOf(poolNetwork),
              1
            )
          }
        }
      })
    )
  }

  async _pifUpdated(pif) {
    // Only if PIF is in a private network
    const poolNetwork = find(this._poolNetworks, { network: pif.network })
    if (!poolNetwork) {
      return
    }

    if (!pif.currently_attached) {
      if (poolNetwork.starCenter !== pif.host) {
        return
      }

      log.debug(
        `PIF: '${pif.device}' of network: '${
          pif.$network.name_label
        }' star-center host: '${
          pif.$host.name_label
        }' has been unplugged, electing a new host`
      )
      const newCenter = await this._electNewCenter(pif.$network, true)
      poolNetwork.starCenter = newCenter ? newCenter.$ref : null
      this._starCenters.delete(pif.$host.$id)
      if (newCenter) {
        this._starCenters.set(newCenter.$id, newCenter.$ref)
      }
    } else {
      if (!poolNetwork.starCenter) {
        const host = pif.$host
        log.debug(
          `First available host: '${
            host.name_label
          }' becomes star center of network: '${pif.$network.name_label}'`
        )
        poolNetwork.starCenter = pif.host
        this._starCenters.set(host.$id, host.$ref)
      }

      log.debug(
        `PIF: '${pif.device}' of network: '${pif.$network.name_label}' host: '${
          pif.$host.name_label
        }' has been plugged`
      )

      const starCenter = await pif.$xapi._getOrWaitObject(
        poolNetwork.starCenter
      )
      await this._addHostToNetwork(pif.$host, pif.$network, starCenter)
    }
  }

  async _hostUpdated(host) {
    const xapi = host.$xapi

    if (host.enabled) {
      if (host.PIFs.length === 0) {
        return
      }

      const tunnels = filter(xapi.objects.all, { $type: 'tunnel' })
      const newHost = find(this._newHosts, { $ref: host.$ref })
      if (newHost) {
        this._newHosts.splice(this._newHosts.indexOf(newHost), 1)
      }
      let i
      for (i = 0; i < tunnels.length; i++) {
        const tunnel = tunnels[i]
        const accessPIF = await xapi._getOrWaitObject(tunnel.access_PIF)
        if (accessPIF.host !== host.$ref) {
          continue
        }

        const poolNetwork = find(this._poolNetworks, {
          network: accessPIF.network,
        })
        if (!poolNetwork) {
          continue
        }

        if (accessPIF.currently_attached) {
          continue
        }

        log.debug(
          `Pluging PIF: ${accessPIF.device} for host: '${
            host.name_label
          } on network: ${accessPIF.$network.name_label}'`
        )
        try {
          await xapi.call('PIF.plug', accessPIF.$ref)
        } catch (error) {
          log.error(
            `XAPI error while pluging PIF: ${accessPIF.device} on host: ${
              host.name_label
            } fo network: ${accessPIF.$network.name_label}`
          )
        }

        const starCenter = await host.$xapi._getOrWaitObject(
          poolNetwork.starCenter
        )
        await this._addHostToNetwork(host, accessPIF.$network, starCenter)
      }
    }
  }

  // ---------------------------------------------------------------------------

  async _setPoolControllerIfNeeded(pool) {
    if (!this._setControllerNeeded(pool.$xapi)) {
      // Nothing to do
      return
    }

    const controller = find(pool.$xapi.objects.all, { $type: 'SDN_controller' })
    if (controller) {
      await pool.$xapi.call('SDN_controller.forget', controller.$ref)
      log.debug(`Remove old SDN controller from pool: ${pool.name_label}`)
    }

    await pool.$xapi.call(
      'SDN_controller.introduce',
      PROTOCOL,
      this._ip,
      OVSDB_PORT
    )
    log.debug(`Became SDN controller of pool: ${pool.name_label}`)
    this._cleaners.push(this._monitorXapi(pool.$xapi))
  }

  _setControllerNeeded(xapi) {
    const controller = find(xapi.objects.all, { $type: 'SDN_controller' })
    return !(
      controller != null &&
      controller.protocol === PROTOCOL &&
      controller.address === this._ip &&
      controller.port === OVSDB_PORT
    )
  }

  // ---------------------------------------------------------------------------

  async _electNewCenter(network, resetNeeded) {
    const pool = network.$pool

    let newCenter
    const hosts = filter(pool.$xapi.objects.all, { $type: 'host' })
    await Promise.all(
      map(hosts, async host => {
        if (resetNeeded) {
          // Clean old ports and interfaces
          const hostClient = find(this._OvsdbClients, { host: host.$ref })
          if (hostClient) {
            await hostClient.resetForNetwork(network.uuid, network.name_label)
          }
        }

        if (newCenter) {
          return
        }

        const pif = find(host.$PIFs, { network: network.$ref })
        if (pif && pif.currently_attached && host.enabled) {
          newCenter = host
        }
      })
    )

    if (!newCenter) {
      log.error(
        `Unable to elect a new star-center host to network: ${
          network.name_label
        } for pool: ${
          network.$pool.name_label
        } because there's no available host`
      )
      return null
    }

    // Recreate star topology
    await Promise.all(
      await map(hosts, async host => {
        await this._addHostToNetwork(host, network, newCenter)
      })
    )

    log.info(
      `New star center host elected: '${newCenter.name_label}' in network: '${
        network.name_label
      }'`
    )

    return newCenter
  }

  async _createTunnel(host, network) {
    const pif = find(host.$PIFs, { physical: true })
    if (!pif) {
      log.error(
        `No PIF found to create tunnel on host: '${
          host.name_label
        }' for network: '${network.name_label}'`
      )
      return
    }

    await host.$xapi.call('tunnel.create', pif.$ref, network.$ref)
    log.debug(
      `Tunnel added on host '${host.name_label}' for network '${
        network.name_label
      }'`
    )
  }

  async _addHostToNetwork(host, network, starCenter) {
    if (host.$ref === starCenter.$ref) {
      // Nothing to do
      return
    }

    const hostClient = find(this._OvsdbClients, {
      host: host.$ref,
    })
    if (!hostClient) {
      log.error(`No OVSDB client found for host: '${host.name_label}'`)
      return
    }

    const starCenterClient = find(this._OvsdbClients, {
      host: starCenter.$ref,
    })
    if (!starCenterClient) {
      log.error(
        `No OVSDB client found for star-center host: '${starCenter.name_label}'`
      )
      return
    }

    await hostClient.addInterfaceAndPort(
      network.uuid,
      network.name_label,
      starCenterClient.address
    )
    await starCenterClient.addInterfaceAndPort(
      network.uuid,
      network.name_label,
      hostClient.address
    )
  }

  // ---------------------------------------------------------------------------

  async _createOvsdbClient(host) {
    const foundClient = find(this._OvsdbClients, { host: host.$ref })
    if (foundClient) {
      return foundClient
    }

    const client = new OvsdbClient(host)
    this._OvsdbClients.push(client)
    try {
      await fromEvent(client, 'connected', {})
    } catch (error) {
      log.error(
        `[${host.name_label}] OVSDB client construction error: ${error}`
      )
      return null
    }

    log.debug(`[${host.name_label}] TLS connection successful`)
    return client
  }
}

export default opts => new SDNController(opts)
