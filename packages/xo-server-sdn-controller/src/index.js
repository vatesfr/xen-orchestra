import assert from 'assert'
import createLogger from '@xen-orchestra/log'
import NodeOpenssl from 'node-openssl-cert'
import uuidv4 from 'uuid/v4'
import { access, constants, readFile, writeFile } from 'fs'
import { EventEmitter } from 'events'
import { filter, find, forEach, forOwn, map, omitBy } from 'lodash'
import { fromCallback, fromEvent } from 'promise-toolbox'
import { join } from 'path'

import { OvsdbClient } from './ovsdb-client'

// =============================================================================

const log = createLogger('xo:xo-server:sdn-controller')

const PROTOCOL = 'pssl'

const CA_CERT = 'ca-cert.pem'
const CLIENT_KEY = 'client-key.pem'
const CLIENT_CERT = 'client-cert.pem'

const SDN_CONTROLLER_CERT = 'sdn-controller-ca.pem'

const NB_DAYS = 9999

// =============================================================================

export const configurationSchema = {
  type: 'object',
  properties: {
    'cert-dir': {
      description: `Full path to a directory where to find: \`client-cert.pem\`,
 \`client-key.pem\` and \`ca-cert.pem\` to create ssl connections with hosts.
 If none is provided, the plugin will create its own self-signed certificates.`,

      type: 'string',
    },
    'override-certs': {
      description: `Replace already existing SDN controller CA certificate`,

      type: 'boolean',
      default: false,
    },
  },
}

// =============================================================================

async function fileWrite(path, data) {
  await fromCallback(writeFile, path, data)
}

async function fileRead(path) {
  const result = await fromCallback(readFile, path)
  return result
}

async function fileExists(path) {
  try {
    await fromCallback(access, path, constants.F_OK)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false
    }

    throw error
  }

  return true
}

// -----------------------------------------------------------------------------

// 2019-09-03
// Compatibility code, to be removed in 1 year.
function updateNetworkOtherConfig(network) {
  return Promise.all(
    map(
      {
        'cross-pool-network-uuid': 'cross_pool_network_uuid',
        encapsulation: 'encapsulation',
        'pif-device': 'pif_device',
        'private-pool-wide': 'private_pool_wide',
        vni: 'vni',
      },
      (oldKey, newKey) => {
        const namespacedKey = `xo:sdn-controller:${newKey}`
        if (network.other_config[namespacedKey] !== undefined) {
          // Nothing to do the update has been done already
          return
        }

        const value = network.other_config[oldKey]
        if (value !== undefined) {
          return network.update_other_config({
            [oldKey]: null,
            [namespacedKey]: value,
          })
        }
      }
    )
  )
}

// =============================================================================

class SDNController extends EventEmitter {
  constructor({ xo, getDataDir }) {
    super()

    this._xo = xo

    this._getDataDir = getDataDir

    this._poolNetworks = []
    this._crossPoolNetworks = {}
    this._ovsdbClients = []
    this._newHosts = []

    this._networks = new Map()
    this._starCenters = new Map()

    this._cleaners = []
    this._objectsAdded = this._objectsAdded.bind(this)
    this._objectsUpdated = this._objectsUpdated.bind(this)

    this._overrideCerts = false

    // VNI: VxLAN Network Identifier, it is used by OpenVSwitch
    // to route traffic of different networks in a single tunnel.
    // See: https://tools.ietf.org/html/rfc7348
    this._prevVni = 0
  }

  // ---------------------------------------------------------------------------

  async configure(configuration) {
    this._overrideCerts = configuration['override-certs']
    let certDirectory = configuration['cert-dir']

    if (certDirectory === undefined) {
      log.debug(`No cert-dir provided, using default self-signed certificates`)
      certDirectory = await this._getDataDir()

      if (!(await fileExists(join(certDirectory, CA_CERT)))) {
        // If one certificate doesn't exist, none should
        assert(
          !(await fileExists(join(certDirectory, CLIENT_KEY))),
          `${CLIENT_KEY} should not exist`
        )
        assert(
          !(await fileExists(join(certDirectory, CLIENT_CERT))),
          `${CLIENT_CERT} should not exist`
        )

        log.debug(`No default self-signed certificates exists, creating them`)
        await this._generateCertificatesAndKey(certDirectory)
      }
    }
    // TODO: verify certificates and create new certificates if needed

    ;[this._clientKey, this._clientCert, this._caCert] = await Promise.all([
      fileRead(join(certDirectory, CLIENT_KEY)),
      fileRead(join(certDirectory, CLIENT_CERT)),
      fileRead(join(certDirectory, CA_CERT)),
    ])

    this._ovsdbClients.forEach(client => {
      client.updateCertificates(this._clientKey, this._clientCert, this._caCert)
    })
    const updatedPools = []
    for (const poolNetwork of this._poolNetworks) {
      if (updatedPools.includes(poolNetwork.pool)) {
        continue
      }

      const xapi = this._xo.getXapi(poolNetwork.pool)
      await this._installCaCertificateIfNeeded(xapi)
      updatedPools.push(poolNetwork.pool)
    }
  }

  async load() {
    // Expose method to create pool-wide private network
    const createPrivateNetwork = params =>
      this._createPrivateNetwork({ ...params, vni: ++this._prevVni })

    createPrivateNetwork.description =
      'Creates a pool-wide private network on a selected pool'
    createPrivateNetwork.params = {
      poolId: { type: 'string' },
      networkName: { type: 'string' },
      networkDescription: { type: 'string' },
      encapsulation: { type: 'string' },
      pifId: { type: 'string' },
    }
    createPrivateNetwork.resolve = {
      xoPool: ['poolId', 'pool', ''],
      xoPif: ['pifId', 'PIF', ''],
    }

    // Expose method to create cross-pool private network
    const createCrossPoolPrivateNetwork = this._createCrossPoolPrivateNetwork.bind(
      this
    )
    createCrossPoolPrivateNetwork.description =
      'Creates a cross-pool private network on selected pools'
    createCrossPoolPrivateNetwork.params = {
      xoPoolIds: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      networkName: { type: 'string' },
      networkDescription: { type: 'string' },
      encapsulation: { type: 'string' },
      xoPifIds: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    }

    this._unsetApiMethods = this._xo.addApiMethods({
      sdnController: {
        createCrossPoolPrivateNetwork,
        createPrivateNetwork,
      },
    })

    // FIXME: we should monitor when xapis are added/removed
    this._xapis = this._xo.getAllXapis()
    await Promise.all(
      map(this._xapis, async xapi => {
        await xapi.objectsFetched

        if (this._setControllerNeeded(xapi)) {
          return
        }

        this._cleaners.push(await this._manageXapi(xapi))
        const hosts = filter(xapi.objects.all, { $type: 'host' })
        for (const host of hosts) {
          this._createOvsdbClient(host)
        }

        // Add already existing pool-wide & cross-pool private networks
        const networks = filter(xapi.objects.all, { $type: 'network' })
        const noVniNetworks = []
        await Promise.all(
          map(networks, async network => {
            // 2019-09-03
            // Compatibility code, to be removed in 1 year.
            await updateNetworkOtherConfig(network)
            network = await network.$xapi.barrier(network.$ref)

            const otherConfig = network.other_config
            if (otherConfig['xo:sdn-controller:private-pool-wide'] !== 'true') {
              return
            }

            const vni = otherConfig['xo:sdn-controller:vni']
            if (vni === undefined) {
              noVniNetworks.push(network)
            } else {
              this._prevVni = Math.max(this._prevVni, +vni)
            }

            log.debug('Adding network to managed networks', {
              network: network.name_label,
              pool: network.$pool.name_label,
            })
            const center = await this._electNewCenter(network, true)

            // Previously created network didn't store `pif_device`
            //
            // 2019-08-22
            // This is used to add the pif_device to networks created before this version. (v0.1.2)
            // This will be removed in 1 year.
            if (otherConfig['xo:sdn-controller:pif-device'] === undefined) {
              const tunnel = this._getHostTunnelForNetwork(center, network.$ref)
              const pif = xapi.getObjectByRef(tunnel.transport_PIF)
              await network.update_other_config(
                'xo:sdn-controller:pif-device',
                pif.device
              )
            }

            this._poolNetworks.push({
              pool: network.$pool.$ref,
              network: network.$ref,
              starCenter: center?.$ref,
            })
            this._networks.set(network.$id, network.$ref)
            if (center !== undefined) {
              this._starCenters.set(center.$id, center.$ref)
            }

            const crossPoolNetworkUuid =
              otherConfig['xo:sdn-controller:cross-pool-network-uuid']
            if (crossPoolNetworkUuid !== undefined) {
              let crossPoolNetwork = this._crossPoolNetworks[
                crossPoolNetworkUuid
              ]
              if (crossPoolNetwork === undefined) {
                crossPoolNetwork = {
                  pools: [],
                  networks: [],
                  uuid: crossPoolNetworkUuid,
                }
                log.debug('Adding cross-pool network', {
                  uuid: crossPoolNetworkUuid,
                })
                this._crossPoolNetworks[crossPoolNetworkUuid] = crossPoolNetwork
              }

              crossPoolNetwork.pools.push(network.$pool.$ref)
              crossPoolNetwork.networks.push(network.$ref)
              log.debug('Pool network added to cross-pool network', {
                network: network.name_label,
                pool: network.$pool.name_label,
                uuid: crossPoolNetworkUuid,
              })
            }
          })
        )

        // Add VNI to other config of networks without VNI
        //
        // 2019-08-22
        // This is used to add the VNI to networks created before this version. (v0.1.3)
        // This will be removed in 1 year.
        await Promise.all(
          map(noVniNetworks, async network => {
            await network.update_other_config(
              'xo:sdn-controller:vni',
              String(++this._prevVni)
            )

            // Re-elect a center to apply the VNI
            const center = await this._electNewCenter(network, true)
            if (center !== undefined) {
              this._starCenters.set(center.$id, center.$ref)
            }
          })
        )
      })
    )

    await Promise.all(
      map(this._crossPoolNetworks, crossPoolNetwork =>
        this._electNewPoolCenter(crossPoolNetwork)
      )
    )
  }

  async unload() {
    this._ovsdbClients = []
    this._poolNetworks = []
    this._crossPoolNetworks = {}
    this._newHosts = []

    this._networks.clear()
    this._starCenters.clear()

    this._cleaners.forEach(cleaner => cleaner())
    this._cleaners = []

    this._unsetApiMethods()
  }

  // ===========================================================================

  async _createPrivateNetwork({
    xoPool,
    networkName,
    networkDescription,
    encapsulation,
    xoPif,
    vni,
  }) {
    const pool = this._xo.getXapiObject(xoPool)
    await this._setPoolControllerIfNeeded(pool)

    const pif = this._xo.getXapiObject(xoPif)

    // Create the private network
    const privateNetworkRef = await pool.$xapi.call('network.create', {
      name_label: networkName,
      name_description: networkDescription,
      MTU: 0,
      other_config: {
        automatic: 'false',
        'xo:sdn-controller:encapsulation': encapsulation,
        'xo:sdn-controller:pif-device': pif.device,
        'xo:sdn-controller:private-pool-wide': 'true',
        'xo:sdn-controller:vni': String(vni),
      },
    })

    const privateNetwork = await pool.$xapi._getOrWaitObject(privateNetworkRef)

    log.info('New private network created', {
      network: privateNetwork.name_label,
      pool: pool.name_label,
    })

    // For each pool's host, create a tunnel to the private network
    const hosts = filter(pool.$xapi.objects.all, { $type: 'host' })
    await Promise.all(
      map(hosts, async host => {
        await this._createTunnel(host, privateNetwork, pif.device)
        this._createOvsdbClient(host)
      })
    )

    const center = await this._electNewCenter(privateNetwork, false)
    const poolNetwork = {
      pool: pool.$ref,
      network: privateNetwork.$ref,
      starCenter: center?.$ref,
    }
    this._poolNetworks.push(poolNetwork)
    this._networks.set(privateNetwork.$id, privateNetwork.$ref)
    if (center !== undefined) {
      this._starCenters.set(center.$id, center.$ref)
    }

    return poolNetwork
  }

  async _createCrossPoolPrivateNetwork({
    xoPoolIds,
    networkName,
    networkDescription,
    encapsulation,
    xoPifIds,
  }) {
    const uuid = uuidv4()
    const crossPoolNetwork = {
      pools: [],
      networks: [],
      uuid,
    }

    log.debug('New cross-pool network created', { uuid })

    const vni = ++this._prevVni
    for (const xoPoolId of xoPoolIds) {
      const xoPool = this._xo.getObject(xoPoolId, 'pool')
      const pool = this._xo.getXapiObject(xoPool)

      const xoPifId = find(xoPifIds, id => {
        const pif = this._xo.getXapiObject(this._xo.getObject(id, 'PIF'))
        return pif.$pool.$ref === pool.$ref
      })
      const xoPif = this._xo.getObject(xoPifId, 'PIF')

      const poolNetwork = await this._createPrivateNetwork({
        xoPool,
        networkName,
        networkDescription,
        encapsulation,
        xoPif,
        vni,
      })

      const network = pool.$xapi.getObjectByRef(poolNetwork.network)
      await network.update_other_config(
        'xo:sdn-controller:cross-pool-network-uuid',
        uuid
      )

      crossPoolNetwork.pools.push(poolNetwork.pool)
      crossPoolNetwork.networks.push(poolNetwork.network)
      log.debug('Pool network added to cross-pool network', {
        network: networkName,
        pool: pool.name_label,
        uuid,
      })
    }

    await this._electNewPoolCenter(crossPoolNetwork)
    this._crossPoolNetworks[uuid] = crossPoolNetwork
  }

  // ---------------------------------------------------------------------------

  async _manageXapi(xapi) {
    const { objects } = xapi

    const objectsRemovedXapi = this._objectsRemoved.bind(this, xapi)
    objects.on('add', this._objectsAdded)
    objects.on('update', this._objectsUpdated)
    objects.on('remove', objectsRemovedXapi)

    await this._installCaCertificateIfNeeded(xapi)

    return () => {
      objects.removeListener('add', this._objectsAdded)
      objects.removeListener('update', this._objectsUpdated)
      objects.removeListener('remove', objectsRemovedXapi)
    }
  }

  _objectsAdded(objects) {
    forEach(objects, object => {
      const { $type } = object

      if ($type === 'host') {
        log.debug('New host', {
          host: object.name_label,
          pool: object.$pool.name_label,
        })

        if (find(this._newHosts, { $ref: object.$ref }) === undefined) {
          this._newHosts.push(object)
        }
        this._createOvsdbClient(object)
      }
    })
  }

  _objectsUpdated(objects) {
    return Promise.all(
      map(objects, object => {
        const { $type } = object

        if ($type === 'PIF') {
          return this._pifUpdated(object)
        }
        if ($type === 'host') {
          return this._hostUpdated(object)
        }
        if ($type === 'host_metrics') {
          return this._hostMetricsUpdated(object)
        }
      })
    )
  }

  _objectsRemoved(xapi, objects) {
    return Promise.all(
      map(objects, async (object, id) => {
        this._ovsdbClients = this._ovsdbClients.filter(
          client => client.host.$id !== id
        )

        // If a Star center host is removed: re-elect a new center where needed
        const starCenterRef = this._starCenters.get(id)
        if (starCenterRef !== undefined) {
          this._starCenters.delete(id)
          const poolNetworks = filter(this._poolNetworks, {
            starCenter: starCenterRef,
          })
          for (const poolNetwork of poolNetworks) {
            const network = xapi.getObjectByRef(poolNetwork.network)
            const newCenter = await this._electNewCenter(network, true)
            poolNetwork.starCenter = newCenter?.$ref
            if (newCenter !== undefined) {
              this._starCenters.set(newCenter.$id, newCenter.$ref)
            }
          }
          return
        }

        // If a network is removed, clean this._poolNetworks from it
        const networkRef = this._networks.get(id)
        if (networkRef !== undefined) {
          this._networks.delete(id)
          this._poolNetworks = this._poolNetworks.filter(
            poolNetwork => poolNetwork.network !== networkRef
          )

          forOwn(this._crossPoolNetworks, crossPoolNetwork => {
            crossPoolNetwork.networks = crossPoolNetwork.networks.filter(
              ref => ref !== networkRef
            )
          })

          this._crossPoolNetworks = omitBy(
            this._crossPoolNetworks,
            crossPoolNetwork => crossPoolNetwork.networks.length === 0
          )
        }
      })
    )
  }

  async _pifUpdated(pif) {
    // Only if PIF is in a private network
    const poolNetwork = find(this._poolNetworks, { network: pif.network })
    if (poolNetwork === undefined) {
      return
    }

    if (!pif.currently_attached) {
      const tunnel = this._getHostTunnelForNetwork(pif.$host, pif.network)
      await tunnel.set_status({ active: 'false' })
      if (poolNetwork.starCenter !== pif.host) {
        return
      }

      log.debug(
        'PIF of star-center host has been unplugged, electing a new star-center',
        {
          pif: pif.device,
          network: pif.$network.name_label,
          host: pif.$host.name_label,
          pool: pif.$pool.name_label,
        }
      )
      const newCenter = await this._electNewCenter(pif.$network, true)
      poolNetwork.starCenter = newCenter?.$ref
      this._starCenters.delete(pif.$host.$id)
      if (newCenter !== undefined) {
        this._starCenters.set(newCenter.$id, newCenter.$ref)
      }
    } else {
      if (poolNetwork.starCenter === undefined) {
        const host = pif.$host
        log.debug('First available host becomes star center of network', {
          host: host.name_label,
          network: pif.$network.name_label,
          pool: pif.$pool.name_label,
        })
        poolNetwork.starCenter = pif.host
        this._starCenters.set(host.$id, host.$ref)

        const crossPoolNetwork = find(
          this._crossPoolNetworks,
          crossPoolNetwork => crossPoolNetwork.networks.includes(pif.network)
        )
        if (crossPoolNetwork !== undefined) {
          if (crossPoolNetwork.poolCenter !== undefined) {
            const centerPoolNetwork = this._getPoolNetwork(
              crossPoolNetwork.poolCenter,
              crossPoolNetwork
            )
            await this._resetCrossPoolConnections(
              poolNetwork,
              crossPoolNetwork.uuid
            )
            await this._clearCenterPoolFromNetwork(
              centerPoolNetwork,
              poolNetwork,
              crossPoolNetwork.uuid
            )
            await this._connectNetworks(
              poolNetwork,
              centerPoolNetwork,
              crossPoolNetwork.uuid
            )
          } else {
            crossPoolNetwork.poolCenter = host.$pool.$ref
            log.debug(
              'First available pool becomes pool center of cross-pool network',
              {
                network: pif.network,
                pool: host.$pool.name_label,
                uuid: crossPoolNetwork.uuid,
              }
            )
          }
        }
      }

      log.debug('PIF plugged', {
        pif: pif.device,
        network: pif.$network.name_label,
        host: pif.$host.name_label,
        pool: pif.$pool.name_label,
      })

      const starCenter = pif.$xapi.getObjectByRef(poolNetwork.starCenter)
      await this._addHostToNetwork(pif.$host, pif.$network, starCenter)
    }
  }

  async _hostUpdated(host) {
    if (host.enabled) {
      if (host.PIFs.length === 0) {
        return
      }

      const newHost = find(this._newHosts, { $ref: host.$ref })
      if (newHost !== undefined) {
        this._newHosts = this._newHosts.slice(
          this._newHosts.indexOf(newHost),
          1
        )

        log.debug('Sync pool certificates', {
          newHost: host.name_label,
          pool: host.$pool.name_label,
        })
        try {
          await host.$xapi.call('pool.certificate_sync')
        } catch (error) {
          log.error('Error while syncing SDN controller CA certificate', {
            error,
            pool: host.$pool.name_label,
          })
        }

        const poolNetworks = filter(this._poolNetworks, {
          pool: host.$pool.$ref,
        })
        for (const poolNetwork of poolNetworks) {
          const tunnel = this._getHostTunnelForNetwork(
            host,
            poolNetwork.network
          )
          if (tunnel !== undefined) {
            continue
          }

          const network = host.$xapi.getObjectByRef(poolNetwork.network)
          const pifDevice =
            network.other_config['xo:sdn-controller:pif-device'] ?? 'eth0'
          this._createTunnel(host, network, pifDevice)
        }

        this._addHostToPoolNetworks(host)
      }
    }
  }

  _hostMetricsUpdated(hostMetrics) {
    const ovsdbClient = find(
      this._ovsdbClients,
      client => client.host.metrics === hostMetrics.$ref
    )

    if (hostMetrics.live) {
      return this._addHostToPoolNetworks(ovsdbClient.host)
    }

    return this._hostUnreachable(ovsdbClient.host)
  }

  // ---------------------------------------------------------------------------

  async _setPoolControllerIfNeeded(pool) {
    if (!this._setControllerNeeded(pool.$xapi)) {
      // Nothing to do
      return
    }

    const controller = find(pool.$xapi.objects.all, { $type: 'SDN_controller' })
    if (controller !== undefined) {
      await pool.$xapi.call('SDN_controller.forget', controller.$ref)
      log.debug('Old SDN controller removed', {
        pool: pool.name_label,
      })
    }

    await pool.$xapi.call('SDN_controller.introduce', PROTOCOL)
    log.debug('SDN controller has been set', {
      pool: pool.name_label,
    })
    this._cleaners.push(await this._manageXapi(pool.$xapi))
  }

  _setControllerNeeded(xapi) {
    const controller = find(xapi.objects.all, { $type: 'SDN_controller' })
    return !(
      controller?.protocol === PROTOCOL &&
      controller.address === '' &&
      controller.port === 0
    )
  }

  // ---------------------------------------------------------------------------

  async _installCaCertificateIfNeeded(xapi) {
    let needInstall = false
    try {
      const result = await xapi.call('pool.certificate_list')
      if (!result.includes(SDN_CONTROLLER_CERT)) {
        needInstall = true
      } else if (this._overrideCerts) {
        await xapi.call('pool.certificate_uninstall', SDN_CONTROLLER_CERT)
        log.debug('Old SDN controller CA certificate uninstalled', {
          pool: xapi.pool.name_label,
        })
        needInstall = true
      }
    } catch (error) {
      log.error('Error while retrieving certificate list', {
        error,
        pool: xapi.pool.name_label,
      })
    }
    if (!needInstall) {
      return
    }

    try {
      await xapi.call(
        'pool.certificate_install',
        SDN_CONTROLLER_CERT,
        this._caCert.toString()
      )
      await xapi.call('pool.certificate_sync')
      log.debug('SDN controller CA certficate installed', {
        pool: xapi.pool.name_label,
      })
    } catch (error) {
      log.error('Error while installing SDN controller CA certificate', {
        error,
        pool: xapi.pool.name_label,
      })
    }
  }

  // ---------------------------------------------------------------------------

  async _electNewPoolCenter(crossPoolNetwork) {
    delete crossPoolNetwork.poolCenter

    let centerPoolNetwork
    const crossPoolCenter = crossPoolNetwork.pools.find(poolRef => {
      centerPoolNetwork = this._getPoolNetwork(poolRef, crossPoolNetwork)
      return centerPoolNetwork.starCenter !== undefined
    })
    if (crossPoolCenter !== undefined) {
      const xapi = find(this._xapis, xapi => xapi.pool.$ref === crossPoolCenter)
      const network = xapi.getObjectByRef(centerPoolNetwork.network)
      const pool = xapi.getObjectByRef(crossPoolCenter)
      crossPoolNetwork.poolCenter = crossPoolCenter
      log.debug('New pool center in cross-pool network', {
        network: network.name_label,
        poolCenter: pool.name_label,
        uuid: crossPoolNetwork.uuid,
      })
    } else {
      log.error('No available pool center for cross-pool network', {
        uuid: crossPoolNetwork.uuid,
      })
      return
    }

    await this._resetCrossPoolConnections(
      centerPoolNetwork,
      crossPoolNetwork.uuid
    )
    for (const poolRef of crossPoolNetwork.pools) {
      if (poolRef === crossPoolNetwork.poolCenter) {
        continue
      }

      const poolNetwork = this._getPoolNetwork(poolRef, crossPoolNetwork)
      await this._resetCrossPoolConnections(poolNetwork, crossPoolNetwork.uuid)
      await this._connectNetworks(
        poolNetwork,
        centerPoolNetwork,
        crossPoolNetwork.uuid
      )
    }
  }

  async _electNewCenter(network, resetNeeded) {
    const pool = network.$pool

    let newCenter
    const hosts = filter(pool.$xapi.objects.all, { $type: 'host' })

    for (const host of hosts) {
      const pif = find(host.$PIFs, { network: network.$ref })
      if (pif?.currently_attached && host.$metrics.live) {
        newCenter = host
      }
    }

    await Promise.all(
      map(hosts, async host => {
        if (!resetNeeded) {
          return
        }

        // Clean old ports and interfaces
        const hostClient = find(
          this._ovsdbClients,
          client => client.host.$ref === host.$ref
        )
        if (hostClient !== undefined) {
          try {
            await hostClient.resetForNetwork(
              network.uuid,
              network.name_label,
              false
            )
          } catch (error) {
            log.error('Error while resetting private network', {
              error,
              network: network.name_label,
              host: host.name_label,
              pool: network.$pool.name_label,
            })
          }
        }
      })
    )

    const crossPoolNetwork = find(this._crossPoolNetworks, crossPoolNetwork =>
      crossPoolNetwork.networks.includes(network.$ref)
    )
    if (newCenter === undefined) {
      log.error('No available host to elect new star-center', {
        network: network.name_label,
        pool: network.$pool.name_label,
      })

      // Re-elect a cross-pool center if needed
      if (crossPoolNetwork?.poolCenter === network.$pool.$ref) {
        const centerPoolNetwork = this._getPoolNetwork(
          crossPoolNetwork.poolCenter,
          crossPoolNetwork
        )
        delete centerPoolNetwork.starCenter
        await this._electNewPoolCenter(crossPoolNetwork)
      }

      return
    }

    // Recreate star topology
    await Promise.all(
      map(hosts, host => this._addHostToNetwork(host, network, newCenter))
    )

    log.info('New star-center elected', {
      center: newCenter.name_label,
      network: network.name_label,
      pool: network.$pool.name_label,
    })

    // If the network is cross-pool: reconnect to other networks
    if (crossPoolNetwork !== undefined) {
      const centerPoolNetwork = this._getPoolNetwork(
        crossPoolNetwork.poolCenter,
        crossPoolNetwork
      )
      if (crossPoolNetwork.poolCenter === newCenter.$pool.$ref) {
        centerPoolNetwork.starCenter = newCenter.$ref
        await this._resetCrossPoolConnections(
          centerPoolNetwork,
          crossPoolNetwork.uuid
        )
        for (const poolRef of crossPoolNetwork.pools) {
          if (poolRef === crossPoolNetwork.poolCenter) {
            continue
          }
          const poolNetwork = this._getPoolNetwork(poolRef, crossPoolNetwork)
          await this._resetCrossPoolConnections(
            poolNetwork,
            crossPoolNetwork.uuid
          )
          await this._connectNetworks(
            poolNetwork,
            centerPoolNetwork,
            crossPoolNetwork.uuid
          )
        }
      } else {
        const poolNetwork = this._getPoolNetwork(
          newCenter.$pool.$ref,
          crossPoolNetwork
        )
        poolNetwork.starCenter = newCenter.$ref
        await this._resetCrossPoolConnections(poolNetwork)
        await this._clearCenterPoolFromNetwork(
          centerPoolNetwork,
          poolNetwork,
          crossPoolNetwork.uuid
        )
        await this._connectNetworks(
          poolNetwork,
          centerPoolNetwork,
          crossPoolNetwork.uuid
        )
      }
    }

    return newCenter
  }

  async _createTunnel(host, network, pifDevice) {
    const hostPif = find(host.$PIFs, { device: pifDevice })
    if (hostPif === undefined) {
      log.error("Can't create tunnel: no available PIF", {
        pif: pifDevice,
        network: network.name_label,
        host: host.name_label,
        pool: host.$pool.name_label,
      })
      return
    }

    try {
      await host.$xapi.call('tunnel.create', hostPif.$ref, network.$ref)
    } catch (error) {
      log.error('Error while creating tunnel', {
        error,
        pif: pifDevice,
        network: network.name_label,
        host: host.name_label,
        pool: host.$pool.name_label,
      })
      return
    }

    log.debug('New tunnel added', {
      pif: pifDevice,
      network: network.name_label,
      host: host.name_label,
      pool: host.$pool.name_label,
    })
  }

  // ---------------------------------------------------------------------------

  async _clearCenterPoolFromNetwork(
    centerPoolNetwork,
    poolNetwork,
    crossPoolNetworkUuid
  ) {
    const centerClient = find(
      this._ovsdbClients,
      client => client.host.$ref === centerPoolNetwork.starCenter
    )
    if (centerClient === undefined) {
      return
    }

    const client = find(
      this._ovsdbClients,
      client => client.host.$ref === poolNetwork.starCenter
    )
    if (client === undefined) {
      return
    }

    const centerNetwork = centerClient.host.$xapi.getObjectByRef(
      centerPoolNetwork.network
    )
    const remoteNetwork = client.host.$xapi.getObjectByRef(poolNetwork.network)
    try {
      await centerClient.resetForNetwork(
        centerNetwork.uuid,
        centerNetwork.name_label,
        true,
        remoteNetwork.uuid
      )
    } catch (error) {
      log.error('Error while clearing pool center from network', {
        error,
        network: remoteNetwork.name_label,
        host: client.host.name_label,
        remotePool: remoteNetwork.$pool.name_label,
        uuid: crossPoolNetworkUuid,
      })
    }
  }

  async _resetCrossPoolConnections(poolNetwork, uuid) {
    const client = find(
      this._ovsdbClients,
      client => client.host.$ref === poolNetwork.starCenter
    )
    if (client === undefined) {
      return
    }

    const network = client.host.$xapi.getObjectByRef(poolNetwork.network)
    try {
      await client.resetForNetwork(network.uuid, network.name_label, true)
    } catch (error) {
      log.error('Error while resetting cross pool connections', {
        error,
        network: network.name_label,
        host: client.host.name_label,
        uuid,
      })
    }
  }

  async _connectNetworks(poolNetwork, centerPoolNetwork, uuid) {
    const client = find(
      this._ovsdbClients,
      client => client.host.$ref === poolNetwork.starCenter
    )
    if (client === undefined) {
      return
    }

    const centerClient = find(
      this._ovsdbClients,
      client => client.host.$ref === centerPoolNetwork.starCenter
    )
    const centerNetwork = centerClient.host.$xapi.getObjectByRef(
      centerPoolNetwork.network
    )
    const network = client.host.$xapi.getObjectByRef(poolNetwork.network)

    // Use centerNetwork VNI by convention
    const otherConfig = centerNetwork.other_config
    const encapsulation =
      otherConfig['xo:sdn-controller:encapsulation'] ?? 'gre'
    const vni = otherConfig['xo:sdn-controller:vni'] ?? '0'
    try {
      await Promise.all([
        client.addInterfaceAndPort(
          network.uuid,
          network.name_label,
          centerClient.host.address,
          encapsulation,
          vni,
          centerNetwork.uuid
        ),
        centerClient.addInterfaceAndPort(
          centerNetwork.uuid,
          centerNetwork.name_label,
          client.host.address,
          encapsulation,
          vni,
          network.uuid
        ),
      ])
    } catch (error) {
      log.error('Error while connecting networks', {
        error,
        network: network.name_label,
        host: client.host.name_label,
        pool: client.host.$pool.name_label,
        centerHost: centerClient.host.name_label,
        centerPool: centerClient.host.$pool.name_label,
        uuid,
      })
      return
    }
    log.debug('Networks connected', {
      network: network.name_label,
      host: client.host.name_label,
      pool: client.host.$pool.name_label,
      centerHost: centerClient.host.name_label,
      centerPool: centerClient.host.$pool.name_label,
      uuid,
    })
  }

  // ---------------------------------------------------------------------------

  async _addHostToNetwork(host, network, starCenter) {
    if (host.$ref === starCenter.$ref) {
      // Nothing to do
      return
    }

    const tunnel = this._getHostTunnelForNetwork(host, network.$ref)
    const starCenterTunnel = this._getHostTunnelForNetwork(
      starCenter,
      network.$ref
    )
    await tunnel.set_status({ active: 'false' })

    const hostClient = find(
      this._ovsdbClients,
      client => client.host.$ref === host.$ref
    )
    if (hostClient === undefined) {
      log.error('No OVSDB client found', {
        host: host.name_label,
        pool: host.$pool.name_label,
      })
      return
    }

    const starCenterClient = find(
      this._ovsdbClients,
      client => client.host.$ref === starCenter.$ref
    )
    if (starCenterClient === undefined) {
      log.error('No OVSDB client found for star-center', {
        host: starCenter.name_label,
        pool: starCenter.$pool.name_label,
      })
      return
    }

    const otherConfig = network.other_config
    const encapsulation =
      otherConfig['xo:sdn-controller:encapsulation'] ?? 'gre'
    const vni = otherConfig['xo:sdn-controller:vni'] ?? '0'
    let bridgeName
    try {
      ;[bridgeName] = await Promise.all([
        hostClient.addInterfaceAndPort(
          network.uuid,
          network.name_label,
          starCenterClient.host.address,
          encapsulation,
          vni
        ),
        starCenterClient.addInterfaceAndPort(
          network.uuid,
          network.name_label,
          hostClient.host.address,
          encapsulation,
          vni
        ),
      ])
    } catch (error) {
      log.error('Error while connecting host to private network', {
        error,
        network: network.name_label,
        host: host.name_label,
        pool: host.$pool.name_label,
      })
    }

    if (bridgeName !== undefined) {
      const activeStatus = { active: 'true', key: bridgeName }
      await Promise.all([
        tunnel.set_status(activeStatus),
        starCenterTunnel.set_status(activeStatus),
      ])
    }
  }

  async _addHostToPoolNetworks(host) {
    const xapi = host.$xapi

    const tunnels = filter(xapi.objects.all, { $type: 'tunnel' })
    for (const tunnel of tunnels) {
      const accessPif = xapi.getObjectByRef(tunnel.access_PIF)
      if (accessPif.host !== host.$ref) {
        continue
      }

      const poolNetwork = find(this._poolNetworks, {
        network: accessPif.network,
      })
      if (poolNetwork === undefined || accessPif.currently_attached) {
        continue
      }

      try {
        await xapi.call('PIF.plug', accessPif.$ref)
      } catch (error) {
        log.error('Error while plugging PIF', {
          error,
          pif: accessPif.device,
          network: accessPif.$network.name_label,
          host: host.name_label,
          pool: host.$pool.name_label,
        })
        continue
      }

      log.debug('PIF plugged', {
        pif: accessPif.device,
        network: accessPif.$network.name_label,
        host: host.name_label,
        pool: host.$pool.name_label,
      })

      const starCenter = xapi.getObjectByRef(poolNetwork.starCenter)
      await this._addHostToNetwork(host, accessPif.$network, starCenter)
    }
  }

  async _hostUnreachable(host) {
    let poolNetworks = filter(this._poolNetworks, { starCenter: host.$ref })
    for (const poolNetwork of poolNetworks) {
      const network = host.$xapi.getObjectByRef(poolNetwork.network)
      log.debug('Unreachable star-center, electing a new one', {
        network: network.name_label,
        center: host.name_label,
        pool: host.$pool.name_label,
      })

      const newCenter = await this._electNewCenter(network, true)
      poolNetwork.starCenter = newCenter?.$ref
      this._starCenters.delete(host.$id)
      if (newCenter !== undefined) {
        this._starCenters.set(newCenter.$id, newCenter.$ref)
      }
    }

    poolNetworks = this._poolNetworks.filter(
      poolNetwork => poolNetwork.pool === host.$pool.$ref
    )
    await Promise.all(
      map(poolNetworks, poolNetwork => {
        const tunnel = this._getHostTunnelForNetwork(host, poolNetwork.network)
        if (tunnel !== undefined) {
          return tunnel.set_status({ active: 'false' })
        }
      })
    )
  }

  // ---------------------------------------------------------------------------

  _getPoolNetwork(poolRef, crossPoolNetwork) {
    const xapi = find(this._xapis, xapi => xapi.pool.$ref === poolRef)
    const networkRef = find(crossPoolNetwork.networks, networkRef => {
      try {
        const network = xapi.getObjectByRef(networkRef)
        return network.$pool.$ref === poolRef
      } catch (error) {
        return false
      }
    })

    return find(this._poolNetworks, {
      pool: poolRef,
      network: networkRef,
    })
  }

  _getHostTunnelForNetwork(host, networkRef) {
    const pif = find(host.$PIFs, { network: networkRef })
    if (pif === undefined) {
      return
    }

    const tunnel = find(host.$xapi.objects.all, {
      $type: 'tunnel',
      access_PIF: pif.$ref,
    })

    return tunnel
  }

  // ---------------------------------------------------------------------------

  _createOvsdbClient(host) {
    const foundClient = find(
      this._ovsdbClients,
      client => client.host.$ref === host.$ref
    )
    if (foundClient !== undefined) {
      return foundClient
    }

    const client = new OvsdbClient(
      host,
      this._clientKey,
      this._clientCert,
      this._caCert
    )
    this._ovsdbClients.push(client)
    return client
  }

  // ---------------------------------------------------------------------------

  async _generateCertificatesAndKey(dataDir) {
    const openssl = new NodeOpenssl()

    const rsakeyoptions = {
      rsa_keygen_bits: 4096,
      format: 'PKCS8',
    }
    const subject = {
      countryName: 'XX',
      localityName: 'Default City',
      organizationName: 'Default Company LTD',
    }
    const csroptions = {
      hash: 'sha256',
      startdate: new Date('1984-02-04 00:00:00'),
      enddate: new Date('2143-06-04 04:16:23'),
      subject: subject,
    }
    const cacsroptions = {
      hash: 'sha256',
      days: NB_DAYS,
      subject: subject,
    }

    // In all the following callbacks, `error` is:
    // - either an error object if there was an error
    // - or a boolean set to `false` if no error occurred
    openssl.generateRSAPrivateKey(rsakeyoptions, (error, cakey, cmd) => {
      if (error !== false) {
        log.error('Error while generating CA private key', {
          error,
        })
        return
      }

      openssl.generateCSR(cacsroptions, cakey, null, (error, csr, cmd) => {
        if (error !== false) {
          log.error('Error while generating CA certificate', {
            error,
          })
          return
        }

        openssl.selfSignCSR(
          csr,
          cacsroptions,
          cakey,
          null,
          async (error, cacrt, cmd) => {
            if (error !== false) {
              log.error('Error while signing CA certificate', {
                error,
              })
              return
            }

            await fileWrite(join(dataDir, CA_CERT), cacrt)
            openssl.generateRSAPrivateKey(
              rsakeyoptions,
              async (error, key, cmd) => {
                if (error !== false) {
                  log.error('Error while generating private key', {
                    error,
                  })
                  return
                }

                await fileWrite(join(dataDir, CLIENT_KEY), key)
                openssl.generateCSR(
                  csroptions,
                  key,
                  null,
                  (error, csr, cmd) => {
                    if (error !== false) {
                      log.error('Error while generating certificate', {
                        error,
                      })
                      return
                    }
                    openssl.CASignCSR(
                      csr,
                      cacsroptions,
                      false,
                      cacrt,
                      cakey,
                      null,
                      async (error, crt, cmd) => {
                        if (error !== false) {
                          log.error('Error while signing certificate', {
                            error,
                          })
                          return
                        }

                        await fileWrite(join(dataDir, CLIENT_CERT), crt)
                        this.emit('certWritten')
                      }
                    )
                  }
                )
              }
            )
          }
        )
      })
    })

    await fromEvent(this, 'certWritten', {})
    log.debug('All certificates have been successfully written')
  }
}

export default opts => new SDNController(opts)
