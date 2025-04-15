import { asyncEach } from '@vates/async-each'

const PLUGIN_NAME = 'open-vswitch.py'

export class OpenFlowPlugin {
  #getBridge(network) {
    return network.bridge // following discussion with David, it may not be the right bridge
    // the plugin may need the bridge name on dom0 side
  }

  async #callPluginOnAllNetwork(network, method, parameters) {
    const bridge = this.#getBridge(network)
    return asyncEach(network.PIFs, async PIF => {
      const host = PIF.host
      return host.$xapi.call('host.call_plugin', host.$ref, PLUGIN_NAME, method, { ...parameters, bridge })
    })
  }

  async addRule({ vif, allow, protocol, ipRange, direction, port }) {
    return this.#callPluginOnAllNetwork(vif.$network, 'add-flow', {
      mac: vif.MAC,
      allow: allow ? 'true' : 'false',
      protocol,
      ipRange,
      direction,
      port,
    })
  }

  async deleteRule({ vif, allow, protocol, ipRange, direction, port }) {
    return this.#callPluginOnAllNetwork(vif.$network, 'del-flow', {
      mac: vif.MAC,
      allow: allow ? 'true' : 'false',
      protocol,
      ipRange,
      direction,
      port,
    })
  }

  async addNetworkRule({ network, allow, protocol, ipRange, direction, port }) {
    return this.#callPluginOnAllNetwork(network, 'add-flow', { allow, protocol, ipRange, direction, port })
  }
  async deleteNetworkRule({ network, allow, protocol, ipRange, direction, port }) {
    return this.#callPluginOnAllNetwork(network, 'del-flow', { allow, protocol, ipRange, direction, port })
  }
  async check(host) {
    return host.$xapi.call('host.call_plugin', host.$ref, PLUGIN_NAME, 'dump-flows', { IHAVEPARAMZ: 'true' })
  }
}
