import assert from 'assert'
import createLogger from '@xen-orchestra/log'
import NodeOpenssl from 'node-openssl-cert'
import { access, constants, readFile, writeFile } from 'fs'
import { EventEmitter } from 'events'
import { filter, find, map } from 'lodash'
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

// =============================================================================

class SDNController extends EventEmitter {
  constructor({ xo, getDataDir }) {
    super()

    this._xo = xo

    this._getDataDir = getDataDir

    this._clientKey = undefined
    this._clientCert = undefined
    this._caCert = undefined

    this._poolNetworks = []
    this._ovsdbClients = []
    this._newHosts = []

    this._networks = new Map()
    this._starCenters = new Map()

    this._cleaners = []
    this._objectsAdded = this._objectsAdded.bind(this)
    this._objectsUpdated = this._objectsUpdated.bind(this)

    this._overrideCerts = false

    this._unsetApiMethod = undefined
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
    const createPrivateNetwork = this._createPrivateNetwork.bind(this)
    createPrivateNetwork.description =
      'Creates a pool-wide private network on a selected pool'
    createPrivateNetwork.params = {
      poolId: { type: 'string' },
      networkName: { type: 'string' },
      networkDescription: { type: 'string' },
      encapsulation: { type: 'string' },
    }
    createPrivateNetwork.resolve = {
      xoPool: ['poolId', 'pool', ''],
    }
    this._unsetApiMethod = this._xo.addApiMethod(
      'plugin.SDNController.createPrivateNetwork',
      createPrivateNetwork
    )

    // FIXME: we should monitor when xapis are added/removed
    await Promise.all(
      map(this._xo.getAllXapis(), async xapi => {
        await xapi.objectsFetched
        if (this._setControllerNeeded(xapi)) {
          return
        }

        this._cleaners.push(await this._manageXapi(xapi))
        const hosts = filter(xapi.objects.all, { $type: 'host' })
        for (const host of hosts) {
          this._createOvsdbClient(host)
        }

        // Add already existing pool-wide private networks
        const networks = filter(xapi.objects.all, { $type: 'network' })
        await Promise.all(
          map(networks, async network => {
            if (network.other_config.private_pool_wide !== 'true') {
              return
            }

            log.debug('Adding network to managed networks', {
              network: network.name_label,
              pool: network.$pool.name_label,
            })
            const center = await this._electNewCenter(network, true)
            this._poolNetworks.push({
              pool: network.$pool.$ref,
              network: network.$ref,
              starCenter: center?.$ref,
            })
            this._networks.set(network.$id, network.$ref)
            if (center !== undefined) {
              this._starCenters.set(center.$id, center.$ref)
            }
          })
        )
      })
    )
  }

  async unload() {
    this._ovsdbClients = []
    this._poolNetworks = []
    this._newHosts = []

    this._networks.clear()
    this._starCenters.clear()

    this._cleaners.forEach(cleaner => cleaner())
    this._cleaners = []

    this._unsetApiMethod()
  }

  // ===========================================================================

  async _createPrivateNetwork({
    xoPool,
    networkName,
    networkDescription,
    encapsulation,
  }) {
    const pool = this._xo.getXapiObject(xoPool)
    await this._setPoolControllerIfNeeded(pool)

    // Create the private network
    const privateNetworkRef = await pool.$xapi.call('network.create', {
      name_label: networkName,
      name_description: networkDescription,
      MTU: 0,
      other_config: {
        automatic: 'false',
        private_pool_wide: 'true',
        encapsulation: encapsulation,
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
        await this._createTunnel(host, privateNetwork)
        this._createOvsdbClient(host)
      })
    )

    const center = await this._electNewCenter(privateNetwork, false)
    this._poolNetworks.push({
      pool: pool.$ref,
      network: privateNetwork.$ref,
      starCenter: center?.$ref,
      encapsulation: encapsulation,
    })
    this._networks.set(privateNetwork.$id, privateNetwork.$ref)
    if (center !== undefined) {
      this._starCenters.set(center.$id, center.$ref)
    }
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

  async _objectsAdded(objects) {
    await Promise.all(
      map(objects, async object => {
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
        } else if ($type === 'host_metrics') {
          await this._hostMetricsUpdated(object)
        }
      })
    )
  }

  async _objectsRemoved(xapi, objects) {
    await Promise.all(
      map(objects, async (object, id) => {
        const client = find(
          this._ovsdbClients,
          client => client.host.$id === id
        )
        if (client !== undefined) {
          this._ovsdbClients.splice(this._ovsdbClients.indexOf(client), 1)
        }

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
          const poolNetwork = find(this._poolNetworks, {
            network: networkRef,
          })
          if (poolNetwork !== undefined) {
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
    if (poolNetwork === undefined) {
      return
    }

    if (!pif.currently_attached) {
      const tunnel = this._getHostTunnelForNetwork(pif.$host, pif.network)
      await pif.$xapi.call('tunnel.set_status', tunnel.$ref, {
        active: 'false',
      })

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
        log.debug('Sync pool certificates', {
          newHost: newHost.name_label,
          pool: newHost.$pool.name_label,
        })
        this._newHosts.splice(this._newHosts.indexOf(newHost), 1)
        try {
          await host.$xapi.call('pool.certificate_sync')
        } catch (error) {
          log.error('Error while syncing SDN controller CA certificate', {
            error,
            pool: host.$pool.name_label,
          })
        }
      }
    }
  }

  async _hostMetricsUpdated(hostMetrics) {
    const ovsdbClient = find(
      this._ovsdbClients,
      client => client.host.metrics === hostMetrics.$ref
    )

    if (hostMetrics.live) {
      await this._addHostToPoolNetworks(ovsdbClient.host)
    } else {
      await this._hostUnreachable(ovsdbClient.host)
    }
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
      controller !== undefined &&
      controller.protocol === PROTOCOL &&
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

  async _electNewCenter(network, resetNeeded) {
    const pool = network.$pool

    let newCenter
    const hosts = filter(pool.$xapi.objects.all, { $type: 'host' })

    for (const host of hosts) {
      const pif = find(host.$PIFs, { network: network.$ref })
      if (pif !== undefined && pif.currently_attached && host.$metrics.live) {
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
            await hostClient.resetForNetwork(network.uuid, network.name_label)
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

    if (newCenter === undefined) {
      log.error('No available host to elect new star-center', {
        network: network.name_label,
        pool: network.$pool.name_label,
      })
      return undefined
    }

    // Recreate star topology
    await Promise.all(
      await map(hosts, async host => {
        await this._addHostToNetwork(host, network, newCenter)
      })
    )

    log.info('New star-center elected', {
      center: newCenter.name_label,
      network: network.name_label,
      pool: network.$pool.name_label,
    })

    return newCenter
  }

  async _createTunnel(host, network) {
    const pif = host.$PIFs.find(
      pif => pif.physical && pif.ip_configuration_mode !== 'None'
    )
    if (pif === undefined) {
      log.error('No PIF found to create tunnel', {
        host: host.name_label,
        network: network.name_label,
      })
      return
    }

    await host.$xapi.call('tunnel.create', pif.$ref, network.$ref)
    log.debug('New tunnel added', {
      network: network.name_label,
      host: host.name_label,
      pool: host.$pool.name_label,
    })
  }

  async _addHostToNetwork(host, network, starCenter) {
    if (host.$ref === starCenter.$ref) {
      // Nothing to do
      return
    }

    const xapi = host.$xapi
    const tunnel = this._getHostTunnelForNetwork(host, network.$ref)
    const starCenterTunnel = this._getHostTunnelForNetwork(
      starCenter,
      network.$ref
    )
    await xapi.call('tunnel.set_status', tunnel.$ref, { active: 'false' })

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

    const encapsulation =
      network.other_config.encapsulation !== undefined
        ? network.other_config.encapsulation
        : 'gre'

    let bridgeName
    try {
      bridgeName = await hostClient.addInterfaceAndPort(
        network.uuid,
        network.name_label,
        starCenterClient.host.address,
        encapsulation
      )
      await starCenterClient.addInterfaceAndPort(
        network.uuid,
        network.name_label,
        hostClient.host.address,
        encapsulation
      )
    } catch (error) {
      log.error('Error while connection host to private network', {
        error,
        network: network.name_label,
        host: host.name_label,
        pool: host.$pool.name_label,
      })
    }

    if (bridgeName !== undefined) {
      const activeStatus = { active: 'true', key: bridgeName }
      await Promise.all([
        xapi.call('tunnel.set_status', tunnel.$ref, activeStatus),
        xapi.call('tunnel.set_status', starCenterTunnel.$ref, activeStatus),
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
    const poolNetworks = filter(this._poolNetworks, { starCenter: host.$ref })
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

    for (const poolNetwork of this._poolNetworks) {
      const tunnel = this._getHostTunnelForNetwork(host, poolNetwork.network)
      await host.$xapi.call('tunnel.set_status', tunnel.$ref, {
        active: 'false',
      })
    }
  }

  // ---------------------------------------------------------------------------

  _getHostTunnelForNetwork(host, networkRef) {
    const pif = find(host.$PIFs, { network: networkRef })
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

    openssl.generateRSAPrivateKey(rsakeyoptions, (error, cakey, cmd) => {
      if (error !== undefined) {
        log.error('Error while generating CA private key', {
          error,
        })
        return
      }

      openssl.generateCSR(cacsroptions, cakey, null, (error, csr, cmd) => {
        if (error !== undefined) {
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
            if (error !== undefined) {
              log.error('Error while signing CA certificate', {
                error,
              })
              return
            }

            await fileWrite(join(dataDir, CA_CERT), cacrt)
            openssl.generateRSAPrivateKey(
              rsakeyoptions,
              async (error, key, cmd) => {
                if (error !== undefined) {
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
                    if (error !== undefined) {
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
                        if (error !== undefined) {
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
