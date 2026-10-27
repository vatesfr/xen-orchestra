import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useVdfVifLocks } from '@/modules/vdf/composables/vdf-vif-lock.composable.ts'
import { useVdfNetworkTagJob } from '@/modules/vdf/jobs/vdf-network-tag.job.ts'
import type { VdfGroup } from '@/modules/vdf/types.ts'
import { isEnforcedLock, type VdfUnenforcedReason, type VdfVifLock } from '@/modules/vdf/utils/vdf-locking.util.ts'
import {
  groupNetworks,
  interfaceAddresses,
  isOnNetworks,
  VDF_UNPROTECTED_TAG,
} from '@/modules/vdf/utils/vdf-networks.util.ts'
import { isVmInGroup } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export type VdfInterface = {
  vif: FrontXoVif
  network: FrontXoNetwork | undefined
  // the network's tags (none when XO doesn't know the network)
  netTags: string[]
  // as agents count them: locked IPs, else what the guest reports
  ips: string[]
  // its lock as the firewall trusts it (vdf#41): a VDF lock its host's
  // agent doesn't list as enforced is vdf-unenforced, for `lockReason`;
  // `lockPrefix`: locked to a prefix
  lock: VdfVifLock
  lockReason?: VdfUnenforcedReason
  lockPrefix?: boolean
  // its guest may use any address (unlocked, a VDF lock not enforced, a
  // lock to a prefix)
  untrusted: boolean
  // its network is left out of the firewall (vdf:unprotected)
  unprotected: boolean
}

// VMs' interfaces as groups see them (vdf#36)
export function useVdfInterfaces() {
  const { vifs, areVifsReady } = useXoVifCollection()

  const { networks, areNetworksReady } = useXoNetworkCollection()

  const { lockOf } = useVdfVifLocks()

  const areInterfacesReady = computed(() => areVifsReady.value && areNetworksReady.value)

  const networkById = computed(() => new Map(networks.value.map(network => [network.id, network])))

  const vifsByVm = computed(() => {
    const byVm = new Map<string, FrontXoVif[]>()

    for (const vif of vifs.value) {
      byVm.set(vif.$VM, [...(byVm.get(vif.$VM) ?? []), vif])
    }

    return byVm
  })

  function interfacesOf(vm: FrontXoVm): VdfInterface[] {
    return (vifsByVm.value.get(vm.id) ?? [])
      .map(vif => {
        const network = networkById.value.get(vif.$network)
        const netTags = network?.tags ?? []
        const { lock, reason, prefix, untrusted } = lockOf(vm, vif, network)

        return {
          vif,
          network,
          netTags,
          // a disabled interface sends nothing: what its guest says counts
          // nowhere, as for agents
          ips: lock === 'disabled' ? [] : interfaceAddresses(vif, vm.addresses, { locked: isEnforcedLock(lock) }),
          lock,
          lockReason: reason,
          lockPrefix: prefix,
          untrusted,
          unprotected: netTags.includes(VDF_UNPROTECTED_TAG),
        }
      })
      .sort((ifaceA, ifaceB) => Number(ifaceA.vif.device) - Number(ifaceB.vif.device))
  }

  // A VM's addresses as agents count them: its interfaces'. What the guest
  // reports for a device the VM has no interface for counts nowhere (the
  // guest writes those keys itself: agent b6846f8)
  function vmAddresses(vm: FrontXoVm) {
    return [...new Set(interfacesOf(vm).flatMap(iface => iface.ips))]
  }

  // the interfaces of a VM a group selects: on its networks, or all
  function groupInterfaces(vm: FrontXoVm, group: VdfGroup | undefined) {
    if (!isVmInGroup(vm.tags, group)) {
      return []
    }

    const networksOfGroup = groupNetworks(group)

    return interfacesOf(vm).filter(iface => isOnNetworks(iface.netTags, networksOfGroup))
  }

  const { t } = useI18n()

  const label = (iface: VdfInterface) =>
    t('firewall:live:interface', { device: iface.vif.device, network: iface.network?.name_label ?? '?' })

  // which interface of a VM with several an address is on: "eth1 · Backend"
  function interfaceLabel(vm: FrontXoVm | undefined, ip: string) {
    const interfaces = vm === undefined ? [] : interfacesOf(vm)
    const iface = interfaces.length > 1 ? interfaces.find(candidate => candidate.ips.includes(ip)) : undefined

    return iface === undefined ? undefined : label(iface)
  }

  // the same for a VIF, by its uuid
  function vifLabel(vm: FrontXoVm | undefined, vifId: string | undefined) {
    const iface = vm === undefined || vifId === undefined ? undefined : interfacesOf(vm).find(i => i.vif.id === vifId)

    return iface === undefined ? undefined : label(iface)
  }

  // the network tags of the interface an address is on (undefined: not a
  // known interface of the VM)
  function netTagsOfAddress(vm: FrontXoVm, ip: string) {
    return interfacesOf(vm).find(iface => iface.ips.includes(ip))?.netTags
  }

  return {
    networks,
    networkById,
    interfacesOf,
    vmAddresses,
    groupInterfaces,
    areInterfacesReady,
    interfaceLabel,
    vifLabel,
    netTagsOfAddress,
  }
}

// Network tags are live edits, like VM tags
export function useVdfNetworkTags() {
  const targets = ref<FrontXoNetwork[]>([])

  const tag = ref<string>()

  const present = ref(true)

  const { run, isRunning } = useVdfNetworkTagJob(targets, tag, present)

  async function setNetworkTag(networks: FrontXoNetwork[], value: string, shouldBePresent: boolean) {
    if (networks.every(network => network.tags.includes(value) === shouldBePresent)) {
      return
    }

    targets.value = networks
    tag.value = value
    present.value = shouldBePresent

    await run()
  }

  return { setNetworkTag, isRunning }
}
