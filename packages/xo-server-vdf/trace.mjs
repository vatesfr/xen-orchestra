import { isIP } from 'node:net'

// Port of vdf-agent's trace orchestration (agent/trace.go: trace, endpoint,
// pickVIF, traceSteps): XO resolves both ends from XAPI, plans the hops and
// asks each host's vdf plugin for its own hop only (`side` set), as the
// plugin never runs a full trace. Keep it in step with trace.go.

// stands for a router's MAC: the source side of a packet leaving its network
const NEXT_HOP_MAC = '02:00:00:00:00:fe'

const PROTOS = new Set(['tcp', 'udp', 'icmp', 'any'])
const STATES = new Set(['new', 'established', 'revoked'])

const isV6 = ip => isIP(ip) === 6

function normalizeIp(ip) {
  return isIP(ip) === 0 ? undefined : ip.toLowerCase()
}

// A VM's addresses as agents count them (agent/inventory.go vmIfaces and
// ifaceAddrs, vdf#36), per VIF: a locked VIF's allowed IPs, nothing for a
// disabled one (itself, or its network's default), else what the guest
// reports for that VIF's device. What the guest reports for a device the
// VM has no VIF for counts nowhere: the guest writes those keys itself, and
// could otherwise claim any address (agent b6846f8).
export function vmAddresses(vm, vifs) {
  const guest = Object.entries(vm.$guest_metrics?.networks ?? {})
  const reported = vifs.flatMap(vif => {
    const mode =
      vif.locking_mode === 'network_default' ? (vif.$network?.default_locking_mode ?? 'unlocked') : vif.locking_mode
    if (mode === 'locked') {
      return [...(vif.ipv4_allowed ?? []), ...(vif.ipv6_allowed ?? [])]
    }
    if (mode === 'disabled') {
      return []
    }
    return guest.filter(([key]) => key.split('/')[0] === String(vif.device)).map(([, ip]) => ip)
  })

  const ipv4 = new Set()
  const ipv6 = new Set()
  for (const value of reported) {
    const ip = normalizeIp(value)
    if (ip === undefined) {
      continue
    }
    if (isIP(ip) === 4) {
      ipv4.add(ip)
    } else if (!ip.startsWith('fe80:')) {
      ipv6.add(ip)
    }
  }
  return { ipv4: [...ipv4].sort(), ipv6: [...ipv6].sort() }
}

// the VIF carrying ip: locking first, then the guest's per-device report,
// else the lowest device (pickVIF)
function pickVif(vifs, guestNetworks, ip) {
  if (vifs.length === 0) {
    return undefined
  }
  const sorted = [...vifs].sort((a, b) => Number(a.device) - Number(b.device) || a.uuid.localeCompare(b.uuid))
  const locked = sorted.find(
    vif => vif.locking_mode === 'locked' && (vif.ipv4_allowed.includes(ip) || vif.ipv6_allowed.includes(ip))
  )
  if (locked !== undefined) {
    return locked
  }
  const devices = new Set(
    Object.entries(guestNetworks ?? {})
      .filter(([, value]) => value === ip)
      .map(([key]) => key.split('/')[0])
  )
  return sorted.find(vif => devices.has(vif.device)) ?? sorted[0]
}

function listVms(xapi) {
  return Object.values(xapi.objects.all).filter(
    object => object.$type === 'VM' && !object.is_control_domain && !object.is_a_template && !object.is_a_snapshot
  )
}

function endpoint(xapi, spec, family) {
  const end = { spec }
  const addr = normalizeIp(spec)
  const vm = listVms(xapi).find(vm => {
    if (vm.uuid === spec) {
      return true
    }
    if (addr === undefined) {
      return false
    }
    const { ipv4, ipv6 } = vmAddresses(vm, vm.$VIFs)
    return ipv4.includes(addr) || ipv6.includes(addr)
  })

  if (vm === undefined) {
    if (addr === undefined) {
      throw new Error(`no VM ${spec} in the pool`)
    }
    return { ...end, ip: addr, external: true }
  }

  const { ipv4, ipv6 } = vmAddresses(vm, vm.$VIFs)
  let ip = addr
  if (ip === undefined) {
    ip = family === 6 ? ipv6[0] : (ipv4[0] ?? (family === 0 ? ipv6[0] : undefined))
  }
  if (ip === undefined) {
    throw new Error(
      `VM ${vm.name_label} has no known IPv${family === 6 ? 6 : 4} address (guest agent not reporting, or VIF not locked)`
    )
  }
  if (vm.power_state !== 'Running' || vm.$resident_on === undefined) {
    throw new Error(`VM ${vm.name_label} isn't running`)
  }

  const vif = pickVif(vm.$VIFs, vm.$guest_metrics?.networks, ip)
  return {
    ...end,
    vm: vm.name_label,
    uuid: vm.uuid,
    ip,
    mac: vif?.MAC,
    vif: vif?.uuid,
    host: vm.$resident_on.name_label,
    hostRef: vm.resident_on,
    networkRef: vif?.network,
  }
}

// one hop on the destination's host when both ends share a network there,
// otherwise the source side is a hop of its own (traceSteps)
function traceSteps(src, dst) {
  const sameL2 = !src.external && !dst.external && src.networkRef !== undefined && src.networkRef === dst.networkRef
  if (dst.external) {
    return { steps: [{ ref: src.hostRef, side: 'source' }], sameL2 }
  }
  if (src.external || (src.hostRef === dst.hostRef && sameL2)) {
    return { steps: [{ ref: dst.hostRef, side: 'destination' }], sameL2 }
  }
  return {
    steps: [
      { ref: src.hostRef, side: 'source' },
      { ref: dst.hostRef, side: 'destination' },
    ],
    sameL2,
  }
}

export function checkTraceArgs({ from, to, proto = 'tcp', port, state = 'new', family = 0, broadcast = false }) {
  if (!from || !to) {
    throw new Error('from and to are required')
  }
  if (!PROTOS.has(proto)) {
    throw new Error('proto must be tcp, udp, icmp or any')
  }
  if (proto === 'tcp' || proto === 'udp') {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`port 1..65535 is required for ${proto}`)
    }
  } else {
    port = undefined
  }
  if (!STATES.has(state)) {
    throw new Error('state must be new, established or revoked')
  }
  if (family !== 0 && family !== 4 && family !== 6) {
    throw new Error('family must be 4 or 6')
  }
  if (broadcast && proto !== 'udp') {
    throw new Error('broadcast traces a UDP broadcast: use proto udp')
  }
  return { from, to, proto, port, state, family, broadcast }
}

function summary(result) {
  const last = result.hops[result.hops.length - 1]
  const why = last.decision?.text ?? 'no VDF stage decided'
  if (result.not_delivered) {
    return `ALLOWED by policy, NOT DELIVERED on ${last.host} (${last.side} side): ${why}; ${last.l2}`
  }
  return `${result.allowed ? 'ALLOWED' : 'BLOCKED'} on ${last.host} (${last.side} side): ${why}`
}

// callHop(hostRef, args) runs one hop through host.call_plugin and returns
// the agent's JSON
export async function trace(xapi, args, callHop) {
  const { from, to, proto, port, state, broadcast } = checkTraceArgs(args)
  const src = endpoint(xapi, from, args.family ?? 0)
  const family = args.family || (isV6(src.ip) ? 6 : 4)
  const dst = endpoint(xapi, to, family)

  if (isV6(src.ip) !== isV6(dst.ip)) {
    throw new Error(`${src.ip} and ${dst.ip} are not of the same family`)
  }
  if (src.external && dst.external) {
    throw new Error('at least one end must be a VM of this pool')
  }
  if (broadcast && dst.external) {
    throw new Error('a broadcast trace needs a VM as destination')
  }

  // hops carry uuids and IPs, never names (the plugin only takes a safe
  // character set), and the addresses chosen here so that every host
  // traces the same packet
  const hopArgs = {
    from: src.external ? src.ip : src.uuid,
    to: dst.external ? dst.ip : dst.uuid,
    proto,
    state,
    family: String(family),
    broadcast: String(broadcast),
  }
  if (!src.external) {
    hopArgs.fromip = src.ip
  }
  if (!dst.external) {
    hopArgs.toip = dst.ip
  }
  if (port !== undefined) {
    hopArgs.port = String(port)
  }

  const { steps, sameL2 } = traceSteps(src, dst)
  const result = {
    from: publicEnd(src),
    to: publicEnd(dst),
    proto,
    port,
    state,
    broadcast,
    allowed: true,
    hops: [],
  }
  for (const step of steps) {
    const stepArgs = { ...hopArgs, side: step.side }
    const dstMac = step.side === 'source' && !sameL2 ? NEXT_HOP_MAC : dst.mac
    if (dstMac !== undefined) {
      stepArgs.dstmac = dstMac
    }
    const hop = await callHop(step.ref, stepArgs).catch(error => {
      const host = xapi.getObjectByRef(step.ref, undefined)?.name_label ?? step.ref
      error.message = `${step.side} side, on ${host}: ${error.message}`
      throw error
    })
    result.hops.push(hop)
    if (!hop.delivered) {
      result.allowed = false
      result.not_delivered = hop.policy_allowed
      break
    }
  }
  result.summary = summary(result)
  return result
}

function publicEnd({ hostRef, networkRef, ...end }) {
  return end
}
