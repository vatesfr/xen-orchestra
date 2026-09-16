function getOrCreate(map, key, Klass) {
  let value = map.get(key)
  if (value === undefined) {
    value = new Klass()
    map.set(key, value)
  }
  return value
}

function addMultiple(set, values) {
  for (const item of values) {
    set.add(item)
  }
}

// Merge old ipv4 protocol with the new protocol and normalize keys
//
// See: https://github.com/xapi-project/xen-api/blob/324bc6ee6664dd915c0bbe57185f1d6243d9ed7e/ocaml/xapi/xapi_guest_agent.ml#L59-L81
export default function normalizeVmNetworks(networks) {
  // Map { [device] => Map { [protocol] => Set { address } } }
  const byDevice = new Map()

  for (const key of Object.keys(networks).sort()) {
    const address = networks[key].trim()

    // Some fields may be empty
    // See https://xcp-ng.org/forum/topic/4810/netbox-plugin-error-ipaddr-the-address-has-neither-ipv6-nor-ipv4-format/27?_=1658735770330
    if (address === '') {
      continue
    }

    const matches = /^(\d+)\/(?:ip|(ipv[46])\/.+)$/.exec(key)
    if (matches === null) {
      continue
    }

    let [, device, protocol] = matches
    if (protocol === undefined) {
      protocol = 'ipv4'
    }

    // Old protocol: when there's more than 1 IP on an interface, the IPs
    // are space or newline delimited in the same `x/ip` field
    // See https://github.com/vatesfr/xen-orchestra/issues/5801#issuecomment-854337568
    //
    // The `x/ip` field may have a `x/ipv4/0` alias
    // e.g:
    // {
    //   '1/ip': '<IP1> <IP2>',
    // }
    // See https://xcp-ng.org/forum/topic/4810
    //
    // There may also be multiple IPs in a `x/ipvx/x` field
    // See https://xcp-ng.org/forum/topic/7625
    addMultiple(getOrCreate(getOrCreate(byDevice, device, Map), protocol, Set), address.split(/\s+/))
  }

  const addressesMap = {}
  for (const [device, byProtocol] of byDevice.entries()) {
    for (const [protocol, addresses] of byProtocol.entries()) {
      let i = 0
      for (const address of addresses) {
        addressesMap[`${device}/${protocol}/${i++}`] = address
      }
    }
  }

  return addressesMap
}
