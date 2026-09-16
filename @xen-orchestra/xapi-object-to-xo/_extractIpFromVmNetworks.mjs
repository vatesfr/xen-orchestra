// See: https://github.com/xapi-project/xen-api/blob/324bc6ee6664dd915c0bbe57185f1d6243d9ed7e/ocaml/xapi/xapi_guest_agent.ml#L59-L81
//
// Returns <min(n)>/ip || <min(n)>/ipv4/<min(m)> || <min(n)>/ipv6/<min(m)> || undefined
// where n corresponds to the network interface and m to its IP
const IPV4_KEY_RE = /^\d+\/ip(?:v4\/\d+)?$/
const IPV6_KEY_RE = /^\d+\/ipv6\/\d+$/
export const extractIpFromVmNetworks = networks => {
  if (networks === undefined) {
    return
  }

  let ipv6
  for (const key of Object.keys(networks).sort()) {
    if (IPV4_KEY_RE.test(key)) {
      return networks[key]
    }

    if (ipv6 === undefined && IPV6_KEY_RE.test(key)) {
      ipv6 = networks[key]
    }
  }
  return ipv6
}
