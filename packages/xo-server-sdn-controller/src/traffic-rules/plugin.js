import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'

const log = createLogger('xo:sdn-controller:traffic-rules:plugin')

const PLUGIN_NAME = 'sdncontroller.py'

// sdncontroller.py error codes: a XenAPIPlugin.Failure code becomes the XAPI
// error code
const E_PARSER = '1'
const E_PORTS = '4'

// The hosts a network's rules are installed on: every host with a PIF on it, as
// the legacy OpenFlowPlugin does. A VIF rule matches its MAC on the whole bridge,
// so it is installed on all of them too.
export function hostsOf(network) {
  return network.$PIFs.map(pif => pif.$host)
}

function ruleArgs(network, { mac, protocol, port, ipRange, direction }) {
  const args = { bridge: network.bridge, protocol, ipRange, direction }
  if (mac !== undefined) {
    args.mac = mac
  }
  if (port !== undefined) {
    args.port = String(port)
  }
  return args
}

export class TrafficRulesPlugin {
  // host $ref → whether its sdncontroller.py supports cookies
  #cookieSupport = new Map()

  // Calls the plugin on each host and reports per host instead of throwing: the
  // engine deletes old flows only where the new ones went in. Resolves to a Map of
  // host $ref → error, `undefined` for a success.
  async #callOnHosts(hosts, method, args, isSuccess = () => false) {
    const outcomes = new Map()
    await asyncEach(hosts, async host => {
      let outcome
      try {
        await host.$xapi.call('host.call_plugin', host.$ref, PLUGIN_NAME, method, args)
      } catch (error) {
        outcome = isSuccess(error) ? undefined : error
      }
      outcomes.set(host.$ref, outcome)
    })
    return outcomes
  }

  // A network rule builds no flow on a host where the network has no VIF port
  // (`add_rule: No rules were build`): nothing to install there is a success,
  // which lets the engine delete that host's old flows.
  install(network, entry, hosts = hostsOf(network)) {
    return this.#callOnHosts(
      hosts,
      'add-rule',
      {
        ...ruleArgs(network, entry),
        allow: entry.allow ? 'true' : 'false',
        priority: String(entry.priority),
        cookie: entry.cookie,
      },
      error => error.code === E_PORTS
    )
  }

  // With a cookie, del-rule deletes exactly the flows carrying it and ignores the
  // other fields, which must still be valid (TCP and UDP need a port).
  deleteCookie(network, rule, cookie, hosts = hostsOf(network)) {
    return this.#callOnHosts(hosts, 'del-rule', { ...ruleArgs(network, rule), cookie })
  }

  // Without a cookie, a cookie-aware plugin deletes by fields, non-strictly, at
  // every priority, and only the flows with cookie 0: the legacy ones. The flows of
  // the ordered list always carry a cookie, so this never reaches them.
  deleteLegacy(network, rule, hosts = hostsOf(network)) {
    return this.#callOnHosts(hosts, 'del-rule', ruleArgs(network, rule))
  }

  // Exact deletes need a plugin that knows `cookie` (xcp-ng-xapi-plugins 10e95c1,
  // 2026-03-16). An older one ignores the argument, and "delete the old cookie"
  // becomes a delete by fields that also removes the flows just added.
  //
  // The plugin has no version call. The probe sends del-rule with a malformed
  // cookie and a match no flow can have: a cookie-aware plugin rejects it in its
  // parser before touching OVS, an older one deletes nothing and succeeds.
  //
  // Resolves to true, to false, or to undefined when no bridge of the host
  // answered (host unreachable…). Only true and false are kept: a host that comes
  // back is probed again.
  async supportsCookies(host) {
    if (this.#cookieSupport.has(host.$ref)) {
      return this.#cookieSupport.get(host.$ref)
    }
    for (const { $network } of host.$PIFs) {
      let supported
      try {
        await host.$xapi.call('host.call_plugin', host.$ref, PLUGIN_NAME, 'del-rule', {
          bridge: $network.bridge,
          mac: '00:00:00:00:00:00',
          direction: 'to',
          protocol: 'ip',
          ipRange: '255.255.255.255',
          cookie: 'not-a-cookie',
        })
        supported = false
      } catch (error) {
        if (error.code !== E_PARSER || !String(error.params?.[0]).includes('cookie')) {
          log.warn('sdncontroller.py cookie probe failed on this bridge', {
            host: host.uuid,
            bridge: $network.bridge,
            error,
          })
          continue
        }
        supported = true
      }
      this.#cookieSupport.set(host.$ref, supported)
      return supported
    }
  }

  // When XO (re)connects to a pool, its plugins may have been updated
  forgetHosts(hosts) {
    for (const host of hosts) {
      this.#cookieSupport.delete(host.$ref)
    }
  }
}
