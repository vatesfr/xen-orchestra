import { asyncEach } from '@vates/async-each'

const PLUGIN_NAME = 'openflow-rules.py'

export class OpenFlowPlugin {
  async #getBridge(network) {
    return network.bridge // following discussion with David, it may not be the right bridge
    // the plugin may need the bridge name on dom0 side
  }
  async #callPluginOnEachHost(vif, method, parameters) {
    const network = vif.$network
    const xapi = vif.$xapi
    const bridge = this.#getBridge()
    await asyncEach(network.PIFs, async pif => {
      const host = pif.$host
      return xapi.call('host.call_plugin', host.$ref, PLUGIN_NAME, method, { ...parameters, bridge })
    })
  }
  async addRule({ vif, allow, protocol, ipRange, direction, ofport }) {
    return this.#callPluginOnEachHost(vif, 'add_rules', {
      mac: vif.MAC,
      allow,
      protocol,
      ipRange,
      direction,
      ofport,
    })
  }
  async deleteRule({ vif, allow, protocol, ipRange, direction, ofport }) {
    return this.#callPluginOnEachHost(vif, 'del_rule', {
      mac: vif.MAC,
      allow,
      protocol,
      ipRange,
      direction,
      ofport,
    })
  }

  async check() {
    const error = new Error('NOPE')
    error.code = 'XENAPI_MISSING_PLUGIN'
  }
}
