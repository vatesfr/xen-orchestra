import { asyncEach } from '@vates/async-each'
import { strictEqual } from 'node:assert'
const PLUGIN_NAME = 'sdn-controller.py'

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
    return this.#callPluginOnAllNetwork(vif.$network, 'add-rule', {
      mac: vif.MAC,
      allow: allow ? 'true' : 'false',
      protocol,
      ipRange,
      direction,
      port,
    })
  }

  async deleteRule({ vif, allow, protocol, ipRange, direction, port }) {
    return this.#callPluginOnAllNetwork(vif.$network, 'del-rule', {
      mac: vif.MAC,
      allow: allow ? 'true' : 'false',
      protocol,
      ipRange,
      direction,
      port,
    })
  }

  async addNetworkRule({ network, allow, protocol, ipRange, direction, port }) {
    return this.#callPluginOnAllNetwork(network, 'add-rule', { allow, protocol, ipRange, direction, port })
  }
  async deleteNetworkRule({ network, allow, protocol, ipRange, direction, port }) {
    return this.#callPluginOnAllNetwork(network, 'del-rule', { allow, protocol, ipRange, direction, port })
  }
  async check(host) {
    await Promise.all(
      host.$PIFs.map(async ({ $network }) => {
        const response = await host.$xapi.call('host.call_plugin', host.$ref, PLUGIN_NAME, 'dump-flows', {
          bridge: $network.bridge,
        })
        const json = JSON.parse(response)
        strictEqual(json.returncode, 0, `plugin check should have a return code of 0 to succeed, got ${json.returncode}`)
      })
    )
  }
}
