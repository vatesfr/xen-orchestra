import assert from 'assert'
import createLogger from '@xen-orchestra/log'
import { EventEmitter } from 'events'
import { filter, find, forOwn, map } from 'lodash'
import { fromCallback, fromEvent } from 'promise-toolbox'
import { OvsdbClient } from './ovsdb-client'
import { existsSync, readFileSync, writeFile } from 'fs'

const log = createLogger('xo:xo-server:sdn-controller')

const PROTOCOL = 'pssl'

const CA_CERT = '/ca-cert.pem'
const CLIENT_KEY = '/client-key.pem'
const CLIENT_CERT = '/client-cert.pem'

const SDN_CONTROLLER_CERT = 'sdn-controller-ca.pem'

exports.configurationSchema = {
  type: 'object',
  properties: {
    'cert-dir': {
      description:
        'Full path to a directory where to find: client-cert.pem, client-key.pem and ca-cert.pem to create ssl connections with hosts.',
      type: 'string',
    },
  },
}

// =============================================================================

class SDNController extends EventEmitter {
  constructor({ xo, getDataDir }) {
    super()

    this._xo = xo

    this._getDataDir = getDataDir

    this._clientKey = null
    this._clientCert = null
    this._caCert = null

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

  async configure(configuration) {
    let certDirectory = configuration['cert-dir']
    if (!certDirectory) {
      log.debug(`No cert-dir provided, creating certificates`)
      certDirectory = await this._getDataDir()

      if (!existsSync(certDirectory + CA_CERT)) {
        // If one certificate doesn't exist, none should
        assert(
          !existsSync(certDirectory + CLIENT_KEY),
          `${CLIENT_KEY} should not exist`
        )
        assert(
          !existsSync(certDirectory + CLIENT_CERT),
          `${CLIENT_CERT} should not exist`
        )

        log.debug(`No generated certificates exists, creating them`)
        await this._generateCertificatesAndKey(certDirectory)
      }
    }

    // All certificates MUST exist now
    assert(existsSync(certDirectory + CA_CERT), `No ${CA_CERT}`)
    assert(existsSync(certDirectory + CLIENT_KEY), `No ${CLIENT_KEY}`)
    assert(existsSync(certDirectory + CLIENT_CERT), `No ${CLIENT_CERT}`)

    this._clientKey = readFileSync(certDirectory + CLIENT_KEY)
    this._clientCert = readFileSync(certDirectory + CLIENT_CERT)
    this._caCert = readFileSync(certDirectory + CA_CERT)

    // TODO: update certificates of all the hosts and install cert
  }

  async load() {
    // FIXME: we should monitor when xapis are added/removed
    forOwn(this._xo.getAllXapis(), async xapi => {
      await xapi.objectsFetched

      if (!this._setControllerNeeded(xapi)) {
        this._cleaners.push(await this._manageXapi(xapi))

        const hosts = filter(xapi.objects.all, { $type: 'host' })
        await Promise.all(
          map(hosts, async host => {
            this._createOvsdbClient(host)
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
    this._OvsdbClients = []
    this._poolNetworks = []
    this._newHosts = []

    this._networks.clear()
    this._starCenters.clear()

    this._cleaners.forEach(cleaner => cleaner())
    this._cleaners = []
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
        this._createOvsdbClient(host)
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
          log.debug(
            `New host: '${object.name_label}' in pool: '${
              object.$pool.name_label
            }'`
          )

          if (!find(this._newHosts, { $ref: object.$ref })) {
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
        }
      })
    )
  }

  async _objectsRemoved(xapi, objects) {
    await Promise.all(
      map(objects, async (object, id) => {
        const client = find(this._OvsdbClients, { id: id })
        if (client) {
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
        try {
          await xapi.call('pool.certificate_sync')
        } catch (error) {
          log.error(
            `Couldn't sync SDN controller ca certificate in pool: ${
              host.$pool.name_label
            } because: ${error}`
          )
        }
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
    } else {
      const poolNetworks = filter(this._poolNetworks, { starCenter: host.$ref })
      let i
      for (i = 0; i < poolNetworks.length; ++i) {
        const poolNetwork = poolNetworks[i]
        const network = await host.$xapi._getOrWaitObject(poolNetwork.network)
        log.debug(
          `Star center host: '${host.name_label}' of network: '${
            network.name_label
          }' in pool: ${
            host.$pool.name_label
          } is no longer reachable, electing a new host`
        )

        const newCenter = await this._electNewCenter(network, true)
        poolNetwork.starCenter = newCenter ? newCenter.$ref : null
        this._starCenters.delete(host.$id)
        if (newCenter) {
          this._starCenters.set(newCenter.$id, newCenter.$ref)
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

    const controller = find(pool.$xapi.objects.all, { $type: 'SDN_controller' })
    if (controller) {
      await pool.$xapi.call('SDN_controller.forget', controller.$ref)
      log.debug(`Remove old SDN controller from pool: ${pool.name_label}`)
    }

    await pool.$xapi.call('SDN_controller.introduce', PROTOCOL)
    log.debug(`Set SDN controller of pool: ${pool.name_label}`)
    this._cleaners.push(await this._manageXapi(pool.$xapi))
  }

  _setControllerNeeded(xapi) {
    const controller = find(xapi.objects.all, { $type: 'SDN_controller' })
    return !(
      controller != null &&
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
      }
    } catch (error) {
      log.error(
        `Couldn't retrieve certificate list of pool: ${xapi.pool.name_label}`
      )
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
      log.debug(
        `SDN controller CA certificate install in pool: ${xapi.pool.name_label}`
      )
    } catch (error) {
      log.error(
        `Couldn't install SDN controller CA certificate in pool: ${
          xapi.pool.name_label
        } because: ${error}`
      )
    }
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

  _createOvsdbClient(host) {
    const foundClient = find(this._OvsdbClients, { host: host.$ref })
    if (foundClient) {
      return foundClient
    }

    const client = new OvsdbClient(
      host,
      this._clientKey,
      this._clientCert,
      this._caCert
    )
    this._OvsdbClients.push(client)
    return client
  }

  // ---------------------------------------------------------------------------

  async _generateCertificatesAndKey(dataDir) {
    const NodeOpenssl = require('node-openssl-cert')
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
      days: 9999,
      subject: subject,
    }

    openssl.generateRSAPrivateKey(rsakeyoptions, (err, cakey, cmd) => {
      if (err) {
        log.error(err)
        return
      }

      openssl.generateCSR(cacsroptions, cakey, null, (err, csr, cmd) => {
        if (err) {
          log.error(err)
          return
        }

        openssl.selfSignCSR(
          csr,
          cacsroptions,
          cakey,
          null,
          async (err, cacrt, cmd) => {
            if (err) {
              log.error(err)
              return
            }

            await this._writeFile(dataDir + CA_CERT, cacrt)
            openssl.generateRSAPrivateKey(
              rsakeyoptions,
              async (err, key, cmd) => {
                if (err) {
                  log.error(err)
                  return
                }

                await this._writeFile(dataDir + CLIENT_KEY, key)
                openssl.generateCSR(csroptions, key, null, (err, csr, cmd) => {
                  if (err) {
                    log.error(err)
                    return
                  }
                  openssl.CASignCSR(
                    csr,
                    cacsroptions,
                    false,
                    cacrt,
                    cakey,
                    null,
                    async (err, crt, cmd) => {
                      if (err) {
                        log.error(err)
                        return
                      }

                      await this._writeFile(dataDir + CLIENT_CERT, crt)
                      this.emit('certWritten')
                    }
                  )
                })
              }
            )
          }
        )
      })
    })

    try {
      await fromEvent(this, 'certWritten', {})
      log.debug('All certificates have been successfully written')
    } catch (error) {
      log.error(`${error}`)
    }
  }

  // ---------------------------------------------------------------------------

  async _writeFile(path, data) {
    try {
      await fromCallback(cb => writeFile(path, data, cb))
      log.debug(`${path} successfully written`)
    } catch (error) {
      log.error(`Couldn't write in: ${path} because: ${error}`)
    }
  }
}

export default opts => new SDNController(opts)
