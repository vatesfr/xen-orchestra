import createLogger from '@xen-orchestra/log'
import { filter, forOwn, sample } from 'lodash'

// =============================================================================

const log = createLogger('xo:xo-server:sdn-controller:private-network')

// =============================================================================

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789?!'
const createPassword = () =>
  Array.from({ length: 16 }, _ => sample(CHARS)).join('')

// =============================================================================

export class PrivateNetwork {
  constructor(controller, uuid) {
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
    const encapsulation =
      otherConfig['xo:sdn-controller:encapsulation'] ?? 'gre'
    const vni = otherConfig['xo:sdn-controller:vni'] ?? '0'
    const password =
      otherConfig['xo:sdn-controller:encrypted'] === 'true'
        ? createPassword()
        : undefined

    let bridgeName
    try {
      ;[bridgeName] = await Promise.all([
        hostClient.addInterfaceAndPort(
          network,
          centerClient.host.address,
          encapsulation,
          vni,
          password,
          this.uuid
        ),
        centerClient.addInterfaceAndPort(
          centerNetwork,
          hostClient.host.address,
          encapsulation,
          vni,
          password,
          this.uuid
        ),
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

    // TODO: make it random
    const hosts = this._getHosts()
    for (const host of hosts) {
      const pif = host.$PIFs.find(
        _ => _.network === this.networks[host.$pool.uuid].$ref
      )
      if (pif?.currently_attached && host.$metrics.live) {
        this.center = host
        break
      }
    }

    if (this.center === undefined) {
      log.error('No available host to elect new star-center', {
        privateNetwork: this.uuid,
      })
      return
    }

    await this._reset()

    // Recreate star topology
    await Promise.all(hosts.map(host => this.addHost(host)))

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
}
