// hostnames on which the server listens on all interfaces: `localhost` is
// reachable there, rewriting it would produce an unroutable target (0.0.0.0)
// and route the request through the HTTP proxy if one is configured
// (https://help.vates.tech/#ticket/zoom/63328)
const WILDCARD_HOSTNAMES = new Set(['0.0.0.0', '::'])

/**
 * Resolves a `[http.proxies]` target URL.
 *
 * `isLocal` tells whether the configured target points at this very machine
 * (`localhost`, possibly rewritten to the bound address): such requests must
 * be sent directly, never through the HTTP proxy agent.
 *
 * @param {string} url
 * @param {'ws:' | 'http:'} protocol
 * @param {object} userHttpConfig - the `http.listen` entry used by the web UI
 * @returns {{ targetUrl: URL, isLocal: boolean }}
 */
export function getProxyTargetUrl(url, protocol, userHttpConfig) {
  let target = url

  if (target.includes('[port]')) {
    target = target.replace(/\[port\]/g, userHttpConfig.port)
  }
  let dynamicProtocol = false
  if (target.includes('[protocol]')) {
    dynamicProtocol = true
    target = target.replace(/\[protocol\]/g, protocol)
  }

  const targetUrl = new URL(target)
  if (dynamicProtocol && userHttpConfig.key !== undefined) {
    targetUrl.protocol = targetUrl.protocol === 'ws:' ? 'wss:' : 'https:'
  }

  const isLocal = targetUrl.hostname === 'localhost'
  const { hostname } = userHttpConfig
  if (isLocal && hostname !== undefined && !WILDCARD_HOSTNAMES.has(hostname)) {
    targetUrl.hostname = hostname
  }

  return { targetUrl, isLocal }
}
