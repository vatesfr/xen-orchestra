import createLogger from '@xen-orchestra/log'
import { filter, find, forOwn, map } from 'lodash'
import { OvsdbClient } from './ovsdb-client'

const log = createLogger('xo:xo-server:sdn-controller')

const PROTOCOL = 'pssl'

class SDNController {
  constructor({ xo }) {
    this._xo = xo

    this._poolNetworks = []
    this._OvsdbBClients = []
    this._newHosts = []

    this._networks = new Map()
    this._starCenters = new Map()
  }

  // ---------------------------------------------------------------------------

  async load() {
    // FIXME: we should monitor when xapis are added/removed
    forOwn(this._xo.getAllXapis(), async xapi => {
      await xapi.objectsFetched

      if (!this._setControllerNeeded(xapi)) {
        this._monitorXapi(xapi)

        const hosts = filter(xapi.objects.all, { $type: 'host' })
        await Promise.all(
          map(hosts, async host => {
            this._OvsdbBClients.push(new OvsdbClient(host))
          })
        )

        // Add already existing pool-wide private networks
        const networks = filter(xapi.objects.all, { $type: 'network' })
        forOwn(networks, async network => {
          if (network.other_config.private_pool_wide === 'true') {
            log.debug(
              `Adding network: '${network.name_label}' to managed networks`
            )
            const center = await this._electNewCenter(network, true)
            this._poolNetworks.push({
              pool: network.$pool.$ref,
              network: network.$ref,
              starCenter: center ? center.$ref : null,
            })
            this._networks.set(network.$id, network.$ref)
            this._starCenters.set(center.$id, center.$ref)
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

  // TODO: remove all listeners + test load/unload
  /*
  async unload() {
    while (!this._OvsdbBClients.empty) {
      delete this._OvsdbBClients.shift()
    }
    while (!this._poolNetworks.empty) {
      this._poolNetworks.shift()
    }
    while (!this._newHosts.empty) {
      this._newHosts.shift()
    }

    this._networks.clear()
    this._starCenters.clear()

    forOwn(this._xo.getAllXapis(), async xapi => {
      const objects = { xapi }

      objects.removeListener('add', this._objectsAdded)
      objects.removeListener('update', this._objectsUpdated)
      objects.removeListener('remove', this._objectsRemoved)
    })
  }
*/

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

        if (!find(this._OvsdbBClients, { host: host.$ref })) {
          this._OvsdbBClients.push(new OvsdbClient(host))
        }
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

    objects.on('add', objects => this._objectsAdded(objects))
    objects.on('update', objects => this._objectsUpdated(objects))
    objects.on('remove', objects => this._objectsRemoved(objects, xapi))
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
          if (!find(this._OvsdbBClients, { host: object.$ref })) {
            this._OvsdbBClients.push(new OvsdbClient(object))
          }
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

  async _objectsRemoved(objects, xapi) {
    await Promise.all(
      map(objects, async (object, id) => {
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
    const result = find(this._poolNetworks, { network: pif.network })
    if (!result) {
      return
    }

    if (!pif.currently_attached) {
      if (result.starCenter !== pif.host) {
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
      result.starCenter = newCenter ? newCenter.$ref : null
      this._starCenters.delete(pif.$host.$id)
      if (newCenter) {
        this._starCenters.set(newCenter.$id, newCenter.$ref)
      }
    } else {
      if (!result.starCenter) {
        const host = pif.$host
        log.debug(
          `First available host: '${
            host.name_label
          }' becomes star center of network: '${pif.$network.name_label}'`
        )
        result.starCenter = pif.host
        this._starCenters.set(host.$id, host.$ref)
      }

      if (pif.host === result.starCenter) {
        // Nothing to do
        return
      }

      log.debug(
        `PIF: '${pif.device}' of network: '${pif.$network.name_label}' host: '${
          pif.$host.name_label
        }' has been plugged`
      )

      const hostClient = find(this._OvsdbBClients, {
        host: pif.host,
      })
      if (!hostClient) {
        log.error(`No OVSDB client found for host: '${pif.$host.name_label}'`)
        return
      }

      const starCenterClient = find(this._OvsdbBClients, {
        host: result.starCenter,
      })
      if (!starCenterClient) {
        const starCenter = await pif.$xapi._getOrWaitObject(result.starCenter)
        log.error(
          `No OVSDB client found for star-center host: '${
            starCenter.name_label
          }'`
        )
        return
      }
      await hostClient.addInterfaceAndPort(
        pif.$network.uuid,
        pif.$network.name_label,
        starCenterClient.address
      )
      await starCenterClient.addInterfaceAndPort(
        pif.$network.uuid,
        pif.$network.name_label,
        hostClient.address
      )
    }
  }

  async _hostUpdated(host) {
    log.debug(`Updated host: ${host.name_label}`)

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
        const starCenterClient = find(this._OvsdbBClients, {
          host: poolNetwork.starCenter,
        })
        if (!starCenterClient) {
          const starCenter = await xapi._getOrWaitObject(poolNetwork.starCenter)
          log.error(
            `Unable to find OVSDB client of star-center host '${
              starCenter.name_label
            }'`
          )
          continue
        }

        const hostClient = find(this._OvsdbBClients, {
          host: host.$ref,
        })
        if (!hostClient) {
          log.error(`Unable to find OVSDB client of host '${host.name_label}'`)
          continue
        }

        const network = accessPIF.$network
        if (newHost) {
          await starCenterClient.addInterfaceAndPort(
            network.uuid,
            network.name_label,
            hostClient.address
          )
        }
      }
    }
  }

  // ---------------------------------------------------------------------------

  async _setPoolControllerIfNeeded(pool) {
    if (!this._setControllerNeeded(pool.$xapi)) {
      // Nothing to do
      return
    }

    this._monitorXapi(pool.$xapi)
  }

  _setControllerNeeded(xapi) {
    const controller = find(xapi.objects.all, { $type: 'SDN_controller' })
    return !(
      controller != null &&
      controller.port === 0 &&
      controller.address === '' &&
      controller.protocol === PROTOCOL
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
          const hostClient = find(this._OvsdbBClients, { host: host.$ref })
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
        `Unable to elect a new star-center host because there's no available host`
      )
      return null
    }

    // Recreate star topology
    const starCenterClient = find(this._OvsdbBClients, {
      host: newCenter.$ref,
    })
    if (!starCenterClient) {
      log.error(`Unable to find OVSDB client of host '${newCenter.name_label}'`)
      return null
    }
    await Promise.all(
      await map(hosts, async host => {
        if (host.$ref === newCenter.$ref) {
          // Nothing to do
          return
        }

        const hostClient = find(this._OvsdbBClients, { host: host.$ref })
        if (!hostClient) {
          log.error(`Unable to find OVSDB client of host '${host.name_label}'`)
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
}

export default opts => new SDNController(opts)
