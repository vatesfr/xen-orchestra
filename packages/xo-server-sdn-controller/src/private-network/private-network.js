import assert from 'assert'
import { createLogger } from '@xen-orchestra/log'
import { filter, forOwn, sample } from 'lodash'

// =============================================================================

const log = createLogger('xo:xo-server:sdn-controller:private-network')

// =============================================================================

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789?!'
const createPassword = () => Array.from({ length: 16 }, _ => sample(CHARS)).join('')

// =============================================================================

export class PrivateNetwork {
  constructor(controller, uuid, preferredCenter) {
    this._preferredCenter = preferredCenter

    this.controller = controller
    this.uuid = uuid
    this.networks = {}

    this.controller.registerPrivateNetwork(this)
  }

  // ---------------------------------------------------------------------------

  async addHost(host) {
    if (host.$ref === this.center?.$ref) {
      // Nothing to do
      return
    }

    const hostClient = this.controller.ovsdbClients[host.$ref]
    if (hostClient === undefined) {
      log.error('No OVSDB client found', {
        host: host.name_label,
        pool: host.$pool.name_label,
      })
      return
    }

    const centerClient = this.controller.ovsdbClients[this.center.$ref]
    if (centerClient === undefined) {
      log.error('No OVSDB client found for star-center', {
        privateNetwork: this.uuid,
        host: this.center.name_label,
        pool: this.center.$pool.name_label,
      })
      return
    }

    const network = this.networks[host.$pool.uuid]
    const centerNetwork = this.networks[this.center.$pool.uuid]
    const otherConfig = network.other_config
    const encapsulation = otherConfig['xo:sdn-controller:encapsulation'] ?? 'gre'
    const vni = otherConfig['xo:sdn-controller:vni'] ?? '0'
    const password = otherConfig['xo:sdn-controller:encrypted'] === 'true' ? createPassword() : undefined

    const transportPif = await this.getTransportPif(network)
    const hostPif = host.$PIFs.find(pif => pif.network === transportPif.network)
    const centerPif = this.center.$PIFs.find(pif => pif.network === transportPif.network)

    assert(hostPif !== undefined, 'No PIF found', {
      privateNetwork: this.uuid,
      host: host.name_label,
    })
    assert(centerPif !== undefined, 'No PIF found in center', {
      privateNetwork: this.uuid,
      host: this.center.name_label,
    })

    let bridgeName
    try {
      ;[bridgeName] = await Promise.all([
        hostClient.addInterfaceAndPort(network, centerPif.IP, encapsulation, vni, password, this.uuid),
        centerClient.addInterfaceAndPort(centerNetwork, hostPif.IP, encapsulation, vni, password, this.uuid),
      ])
    } catch (error) {
      log.error('Error while connecting host to private network', {
        error,
        privateNetwork: this.uuid,
        network: network.name_label,
        host: host.name_label,
        pool: host.$pool.name_label,
      })
      return
    }
    log.info('Host added', {
      privateNetwork: this.uuid,
      network: network.name_label,
      host: host.name_label,
      pool: host.$pool.name_label,
    })

    return bridgeName
  }

  addNetwork(network) {
    this.networks[network.$pool.uuid] = network
    log.info('Adding network', {
      privateNetwork: this.uuid,
      network: network.name_label,
      pool: network.$pool.name_label,
    })
    if (this.center === undefined) {
      return this.electNewCenter()
    }

    const hosts = filter(network.$pool.$xapi.objects.all, { $type: 'host' })
    return Promise.all(
      hosts.map(async host => {
        const hostClient = this.controller.ovsdbClients[host.$ref]
        const network = this.networks[host.$pool.uuid]
        await hostClient.resetForNetwork(network, this.uuid)
        await this.addHost(host)
      })
    )
  }

  async electNewCenter() {
    delete this.center

    if (this._preferredCenter !== undefined) {
      this._preferredCenter = await this._preferredCenter.$xapi.barrier(this._preferredCenter.$ref)
    }

    this.center = this._findBestCenter()
    if (this.center === undefined) {
      log.error('No available host to elect new star-center', {
        privateNetwork: this.uuid,
      })
      return
    }

    await this._reset()

    // Recreate star topology
    await Promise.all(this._getHosts().map(host => this.addHost(host)))
    log.info('New star-center elected', {
      center: this.center.name_label,
      privateNetwork: this.uuid,
    })
  }

  // ---------------------------------------------------------------------------

  getPools() {
    const pools = []
    forOwn(this.networks, network => {
      pools.push(network.$pool)
    })
    return pools
  }

  /**
   *
   * @param {Network} network
   * @returns {Pif} returns one transport_PIF of the private network
   */
  async getTransportPif(network) {
    // ensure to get a fresh version of the network
    network = await network.$xapi.getRecord('network', network.$ref)
    const privatePif = network.$PIFs[0]
    const tunnels = privatePif.$tunnel_access_PIF_of
    return tunnels.find(tunnel => tunnel.$transport_PIF.ip_configuration_mode !== 'None').$transport_PIF
  }

  // ---------------------------------------------------------------------------

  _reset() {
    return Promise.all(
      this._getHosts().map(async host => {
        // Clean old ports and interfaces
        const hostClient = this.controller.ovsdbClients[host.$ref]
        if (hostClient === undefined) {
          return
        }

        const network = this.networks[host.$pool.uuid]
        try {
          await hostClient.resetForNetwork(network, this.uuid)
        } catch (error) {
          log.error('Error while resetting private network', {
            error,
            privateNetwork: this.uuid,
            network: network.name_label,
            host: host.name_label,
            pool: network.$pool.name_label,
          })
        }
      })
    )
  }

  // ---------------------------------------------------------------------------

  _getHosts() {
    const hosts = []
    forOwn(this.networks, network => {
      hosts.push(...filter(network.$pool.$xapi.objects.all, { $type: 'host' }))
    })
    return hosts
  }

  _hostCanBeCenter(host) {
    const pif = host.$PIFs.find(_ => _.network === this.networks[host.$pool.uuid].$ref)
    return pif?.currently_attached && host.$metrics.live
  }

  _findBestCenter() {
    if (this._preferredCenter !== undefined && this._hostCanBeCenter(this._preferredCenter)) {
      return this._preferredCenter
    }

    // TODO: make it random
    for (const host of this._getHosts()) {
      if (this._hostCanBeCenter(host)) {
        return host
      }
    }
  }
}
