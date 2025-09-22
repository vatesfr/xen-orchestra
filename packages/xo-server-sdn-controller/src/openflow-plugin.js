import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { strictEqual } from 'node:assert'

const PLUGIN_NAME = 'sdncontroller.py'

const log = createLogger('xo:sdn-controller:openflowplugin')
export class OpenFlowPlugin {
  #getBridge(network) {
    return network.bridge // following discussion with David, it may not be the right bridge
    // the plugin may need the bridge name on dom0 sides
  }

  async #callPluginOnAllNetwork(network, method, parameters) {
    const bridge = this.#getBridge(network)
    return asyncEach(network.$PIFs, async PIF => {
      const host = PIF.$host
      return host.$xapi.call('host.call_plugin', host.$ref, PLUGIN_NAME, method, { ...parameters, bridge })
    })
  }

  async addRule({ vif, allow, protocol, ipRange, direction, port }) {
    log.debug('addRule', { vif, allow, protocol, ipRange, direction, port })
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
    log.debug('deleteRule', { vif, allow, protocol, ipRange, direction, port })
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
    log.debug('addNetworkRule', { network, allow, protocol, ipRange, direction, port })
    return this.#callPluginOnAllNetwork(network, 'add-rule', { allow, protocol, ipRange, direction, port })
  }
  async deleteNetworkRule({ network, allow, protocol, ipRange, direction, port }) {
    log.debug('deleteNetworkRule', { network, allow, protocol, ipRange, direction, port })
    return this.#callPluginOnAllNetwork(network, 'del-rule', { allow, protocol, ipRange, direction, port })
  }

  async check(host) {
    log.debug('check', { host })
    // if at least one of the network can answer with a well formed answer from the plugin
    // then the plugin is considered installed and working
    // some network can fails this test,
    let lastError
    for (const { $network } of host.$PIFs) {
      try {
        const response = await host.$xapi.call('host.call_plugin', host.$ref, PLUGIN_NAME, 'dump-flows', {
          bridge: $network.bridge,
        })
        const json = JSON.parse(response)
        strictEqual(
          json.returncode,
          0,
          `plugin check should have a return code of 0 to succeed, got ${json.returncode}`
        )
        // one of the network is valid, let's stop the check here
        return true
      } catch (error) {
        if (error.code === 'XENAPI_MISSING_PLUGIN') {
          // plugin is not installed , no need to test other networks
          throw error
        }
        log.error('error while checking if the host has the sdn plugin', error)
        // track at least
        lastError = error
      }
    }

    throw lastError ?? new Error(`No network associated to host ${host.id}`)
  }
}
