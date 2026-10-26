/// <reference path="../types/promise-toolbox.d.ts" />

import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { strictEqual } from 'node:assert'
import pTimeout from 'promise-toolbox/timeout'

const PLUGIN_NAME = 'sdncontroller.py'

// The plugin installs or removes a few flows, in milliseconds. A host silent for 30 s is hung,
// not slow: the call fails, and releases the network lock every other rule change on this
// network waits for. xen-api's default of an hour would hold that lock for as long.
const CALL_PLUGIN_TIMEOUT = 30e3

const log = createLogger('xo:sdn-controller:openflowplugin')

// Not failures: an offline host restarts without any flow. A network rule builds no flow on a
// host where its network has no VIF (sdncontroller.py's E_PORTS, code '4'), and is saved anyway,
// as in the legacy code. A VIF rule always has its MAC, so the plugin builds it on every host:
// a '4' from it is a real failure.
/**
 * @param {import('./traffic-rules.js').Owner} owner
 * @param {unknown} error
 */
function isIgnored(owner, error) {
  if (!(error instanceof Error) || !('code' in error)) {
    return false
  }
  return error.code === 'HOST_OFFLINE' || (error.code === '4' && owner.$type !== 'VIF')
}

export class OpenFlowPlugin {
  #getBridge(network) {
    return network.bridge // following discussion with David, it may not be the right bridge
    // the plugin may need the bridge name on dom0 sides
  }

  // Runs a sdncontroller.py method on every host with a PIF on the network. A VIF rule matches its
  // MAC on the whole bridge, so it is on every host too, and keeps applying while its VM migrates.
  /**
   * @param {import('./traffic-rules.js').Owner} owner
   * @param {'add-rule' | 'del-rule'} method
   * @param {import('./traffic-rules.js').Rule} rule
   * @param {Record<string, string>} extraArgs
   */
  #callPluginOnAllNetwork(owner, method, rule, extraArgs) {
    const network = owner.$type === 'VIF' ? owner.$network : owner
    // the plugin takes strings, and no key for a missing value
    /** @type {Record<string, string>} */
    const args = {
      bridge: this.#getBridge(network),
      protocol: rule.protocol,
      ipRange: rule.ipRange,
      direction: rule.direction,
    }
    if (owner.$type === 'VIF') {
      args.mac = owner.MAC
    }
    if (rule.port !== undefined) {
      args.port = String(rule.port)
    }
    return asyncEach(
      network.$PIFs,
      async ({ $host: host }) => {
        try {
          await pTimeout.call(
            host.$xapi.call('host.call_plugin', host.$ref, PLUGIN_NAME, method, { ...args, ...extraArgs }),
            CALL_PLUGIN_TIMEOUT
          )
        } catch (error) {
          if (!isIgnored(owner, error)) {
            throw error
          }
          log.info('sdncontroller.py failure ignored', {
            method,
            host: host.uuid,
            network: network.uuid,
            vif: owner.$type === 'VIF' ? owner.uuid : undefined,
            rule,
            error,
          })
        }
      },
      { stopOnError: false }
    )
  }

  // `args` holds `allow`, `priority` and the `cookie` of the rule, see traffic-rules.js
  /**
   * @param {import('./traffic-rules.js').Owner} owner the network or the VIF of the rule
   * @param {import('./traffic-rules.js').Rule} rule
   * @param {Record<string, string>} args
   */
  addRule(owner, rule, args) {
    return this.#callPluginOnAllNetwork(owner, 'add-rule', rule, args)
  }

  // `args` holds the `cookie` of the rule, if any, see traffic-rules.js
  /**
   * @param {import('./traffic-rules.js').Owner} owner the network or the VIF of the rule
   * @param {import('./traffic-rules.js').Rule} rule
   * @param {Record<string, string>} args
   */
  deleteRule(owner, rule, args) {
    return this.#callPluginOnAllNetwork(owner, 'del-rule', rule, args)
  }

  async check(host) {
    log.debug('check', { host })
    // if at least one of the network can answer with a well formed answer from the plugin
    // then the plugin is considered installed and working
    // some network can fails this test,
    let lastError
    if (!host.$PIFs) {
      log.error('error while listing the host PIFs', host)
      lastError = new Error(`No network associated to host ${host.id}`)
    } else {
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
          log.warn('error while checking if the host has the sdn plugin', {
            host: host.uuid,
            network: $network.uuid,
            bridge: $network.bridge,
            error,
          })
          // track it: it will be throw only if no call_plugin successed
          lastError = error
        }
      }
    }

    throw lastError
  }
}
