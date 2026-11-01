import type { VdfGroup } from '@/modules/vdf/types.ts'

// PER-NETWORK GROUPS (vdf#36): a group selects interfaces, those of its
// VMs on networks carrying all its network tags (every interface when it
// has none). XO tags the networks a group is scoped to: the tag, not the
// network, is what the document names, so the same group works in every
// pool.

export const VDF_NET_TAG_PREFIX = 'vdf:net='

// on a network: its interfaces get no VDF flows (storage, transit…)
export const VDF_UNPROTECTED_TAG = 'vdf:unprotected'

export const groupNetworks = (group: VdfGroup | undefined) => group?.networks ?? []

export const isOnNetworks = (netTags: readonly string[], networks: readonly string[]) =>
  networks.every(tag => netTags.includes(tag))

// A GROUP ON NETWORKS ALONE (vdf#98): networks and no tags. As a policy's
// appliedTo, every interface, current and future, on networks carrying
// all its network tags, whatever its VM's tags (vdf:unprotected networks
// left out); never a rule's peer (yet).
export const isNetworksOnly = (group: VdfGroup | undefined) =>
  (group?.tags ?? []).length === 0 && groupNetworks(group).length > 0

// the interfaces (their network tags) such a group selects
export const selectsByNetwork = (group: VdfGroup | undefined, netTags: readonly string[]) =>
  isNetworksOnly(group) && !netTags.includes(VDF_UNPROTECTED_TAG) && isOnNetworks(netTags, groupNetworks(group))

// how a network tag reads: "dmz" for vdf:net=dmz
export const networkTagLabel = (tag: string) =>
  tag.startsWith(VDF_NET_TAG_PREFIX) ? tag.slice(VDF_NET_TAG_PREFIX.length) : tag

// the tag XO proposes for a network: vdf:net= and its name, lower case,
// words joined by dashes ("DMZ VLAN 20": vdf:net=dmz-vlan-20)
export function networkTagFor(name: string) {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
    .replace(/-+$/, '')

  return VDF_NET_TAG_PREFIX + (slug || 'network')
}

export const isNetworkTag = (tag: string) => /^vdf:net=[a-z0-9][a-z0-9._-]*$/.test(tag)

// A VM's interface as agents see it (agent/inventory.go vmIfaces): a locked
// VIF's allowed addresses (trusted), else what the guest reports for its
// device; IPv6 link-local left out. `locked`: XAPI's lock, or a VDF lock
// its host's agent enforces (vdf#41, vifLock).
export type VdfInterfaceVif = {
  device: string
  lockingMode: string
  allowedIpv4Addresses?: string[]
  allowedIpv6Addresses?: string[]
}

// IPv6 link-local (fe80::/10): per link, meaningless on another host, so
// never a member address (agent splitAddrs); a lock may allow one
export const isLinkLocal = (ip: string) => /^fe[89ab][0-9a-f]:/i.test(ip.trim())

export function interfaceAddresses(
  vif: VdfInterfaceVif,
  guestAddresses: Record<string, string> | undefined,
  { locked = vif.lockingMode === 'locked' }: { locked?: boolean } = {}
) {
  const raw = locked
    ? [...(vif.allowedIpv4Addresses ?? []), ...(vif.allowedIpv6Addresses ?? [])]
    : Object.entries(guestAddresses ?? {})
        .filter(([key]) => key.split('/')[0] === String(vif.device))
        .map(([, ip]) => ip)

  return [...new Set(raw.filter(ip => !ip.includes('/') && !isLinkLocal(ip)))].sort(
    (ipA, ipB) => Number(ipA.includes(':')) - Number(ipB.includes(':')) || ipA.localeCompare(ipB)
  )
}
