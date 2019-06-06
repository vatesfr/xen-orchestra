import createLogger from '@xen-orchestra/log'
import { filter, find, map } from 'lodash'
import forOwn from 'lodash/forOwn'
import { OVSDBClient } from './ovsdb-client'

const log = createLogger('xo:xo-server:sdn-controller')

const PROTOCOL = 'pssl'

class SDNController {
  constructor({ xo }) {
    this._xo = xo
    this._poolNetworks = []
    this._OVSDBClients = []
    this._newHosts = []
    this._networks = new Map()
    this._starCenters = new Map()
  }

  async load() {
    // FIXME: we should monitor when xapis are added/removed
    forOwn(this._xo.getAllXapis(), async xapi => {
      await xapi.objectsFetched

      if (this.setControllerNotNeeded(xapi)) {
        this.monitorXapi(xapi)

        const hosts = filter(xapi.objects.all, { $type: 'host' })
        await Promise.all(
          map(hosts, async host => {
            this._OVSDBClients.push(new OVSDBClient(host))
          })
        )

        // Add already existing pool-wide private networks
        const networks = filter(xapi.objects.all, { $type: 'network' })
        forOwn(networks, async network => {
          if (network.other_config.private_pool_wide === 'true') {
            log.debug(
              `Adding network: '${network.name_label}' to managed networks`
            )
            const center = await this.electNewCenter(network, true)
            this._poolNetworks.push({
              pool: network.$pool.$ref,
              network: network.$ref,
              starCenter: center.$ref,
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

  async unload() {
    while (!this._OVSDBClients.empty) {
      delete this._OVSDBClients.shift()
    }

    this._networks.clear()
  }

  monitorXapi(xapi) {
    const { objects } = xapi

    objects.on('add', async objects => {
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
            if (!find(this._OVSDBClients, { host: object.$ref })) {
              this._OVSDBClients.push(new OVSDBClient(object))
            }
          }
        })
      )
    })

    objects.on('update', async objects => {
      await Promise.all(
        map(objects, async (object, id) => {
          const { $type } = object

          if ($type === 'PIF') {
            // Only if PIF is in a private network
            const result = find(this._poolNetworks, { network: object.network })
            if (!result) {
              return
            }

            if (!object.currently_attached) {
              if (result.starCenter === object.host) {
                log.debug(
                  `PIF: '${object.device}' of network: '${
                    object.$network.name_label
                  }' star-center host: '${
                    object.$host.name_label
                  }' has been unplugged, electing a new host`
                )
                const newCenter = await this.electNewCenter(
                  object.$network,
                  true
                )
                if (newCenter) {
                  result.starCenter = newCenter.$ref
                  this._starCenters.delete(object.$host.$id)
                  this._starCenters.set(newCenter.$id, newCenter.$ref)
                }
              }
            } else {
              if (object.host === result.starCenter) {
                // Nothing to do
                return
              }

              log.debug(
                `PIF: '${object.device}' of network: '${
                  object.$network.name_label
                }' host: '${object.$host.name_label}' has been plugged`
              )

              const hostClient = find(this._OVSDBClients, {
                host: object.host,
              })
              if (!hostClient) {
                log.error(
                  `No OVSDB client found for host '${object.$host.name_label}'`
                )
                return
              }

              const starCenter = await xapi._getOrWaitObject(result.starCenter)
              await hostClient.addInterfaceAndPort(
                object.$network.uuid,
                object.$network.name_label,
                starCenter.address
              )
            }
          } else if ($type === 'host') {
            log.debug(`Updated host: ${object.name_label}`)

            if (object.enabled) {
              if (object.PIFs.length === 0) {
                return
              }

              const tunnels = filter(xapi.objects.all, { $type: 'tunnel' })
              const newHost = find(this._newHosts, { $ref: object.$ref })
              if (newHost) {
                this._newHosts.splice(this._newHosts.indexOf(newHost), 1)
              }
              let i
              for (i = 0; i < tunnels.length; i++) {
                const tunnel = tunnels[i]
                const accessPIF = await xapi._getOrWaitObject(tunnel.access_PIF)
                if (accessPIF.host !== object.$ref) {
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
                    object.name_label
                  } on network: ${accessPIF.$network.name_label}'`
                )
                try {
                  await xapi.call('PIF.plug', accessPIF.$ref)
                } catch (error) {
                  log.error(
                    `XAPI error while pluging PIF: ${
                      accessPIF.device
                    } on host: ${object.name_label} fo network: ${
                      accessPIF.$network.name_label
                    }`
                  )
                }
                const starCenterClient = find(this._OVSDBClients, {
                  host: poolNetwork.starCenter,
                })
                if (!starCenterClient) {
                  log.error(
                    `Unable to find OVSDB client of star-center host '${await xapi._getOrWaitObject(
                      poolNetwork.starCenter
                    ).name_label}'`
                  )
                  continue
                }

                const hostClient = find(this._OVSDBClients, {
                  host: object.$ref,
                })
                if (!hostClient) {
                  log.error(
                    `Unable to find OVSDB client of host '${object.name_label}'`
                  )
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
        })
      )
    })

    objects.on('remove', async objects => {
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
              const newCenter = await this.electNewCenter(network, true)
              if (newCenter) {
                poolNetwork.starCenter = newCenter.$ref
                this._starCenters.set(newCenter.$id, newCenter.$ref)
              }
            }
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
    })
  }

  async setPoolControllerIfNeeded(pool) {
    if (this.setControllerNotNeeded(pool.$xapi)) {
      // Nothing to do
      return
    }

    this.monitorXapi(pool.$xapi)
  }

  setControllerNotNeeded(xapi) {
    const controller = find(xapi.objects.all, { $type: 'SDN_controller' })
    return (
      controller &&
      controller.port === 0 &&
      controller.address === '' &&
      controller.protocol === PROTOCOL
    )
  }

  async createPrivateNetwork(pool, networkName) {
    await this.setPoolControllerIfNeeded(pool)

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
        await this.createTunnel(host, privateNetwork)

        if (!find(this._OVSDBClients, { host: host.$ref })) {
          this._OVSDBClients.push(new OVSDBClient(host))
        }
      })
    )

    const center = await this.electNewCenter(privateNetwork, false)
    this._poolNetworks.push({
      pool: pool.$ref,
      network: privateNetwork.$ref,
      starCenter: center.$ref,
    })
    this._networks.set(privateNetwork.$id, privateNetwork.$ref)
    this._starCenters.set(center.$id, center.$ref)
  }

  async electNewCenter(network, resetNeeded) {
    const pool = network.$pool

    let newCenter
    const hosts = filter(pool.$xapi.objects.all, { $type: 'host' })
    await Promise.all(
      map(hosts, async host => {
        if (resetNeeded) {
          // Clean old ports and interfaces
          const hostClient = find(this._OVSDBClients, { host: host.$ref })
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
    const starCenterClient = find(this._OVSDBClients, {
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

        const hostClient = find(this._OVSDBClients, { host: host.$ref })
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

  async createTunnel(host, network) {
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
