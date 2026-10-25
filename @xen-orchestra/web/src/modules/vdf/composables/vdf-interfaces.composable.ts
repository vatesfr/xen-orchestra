import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useVdfNetworkTagJob } from '@/modules/vdf/jobs/vdf-network-tag.job.ts'
import type { VdfGroup } from '@/modules/vdf/types.ts'
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

export type VdfInterface = {
  vif: FrontXoVif
  network: FrontXoNetwork | undefined
  // the network's tags (none when XO doesn't know the network)
  netTags: string[]
  // as agents count them: locked IPs, else what the guest reports
  ips: string[]
  // its network is left out of the firewall (vdf:unprotected)
  unprotected: boolean
}

// VMs' interfaces as groups see them (vdf#36)
export function useVdfInterfaces() {
  const { vifs, areVifsReady } = useXoVifCollection()

  const { networks, areNetworksReady } = useXoNetworkCollection()

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

        return {
          vif,
          network,
          netTags,
          ips: interfaceAddresses(vif, vm.addresses),
          unprotected: netTags.includes(VDF_UNPROTECTED_TAG),
        }
      })
      .sort((ifaceA, ifaceB) => Number(ifaceA.vif.device) - Number(ifaceB.vif.device))
  }

  // the interfaces of a VM a group selects: on its networks, or all
  function groupInterfaces(vm: FrontXoVm, group: VdfGroup | undefined) {
    if (!isVmInGroup(vm.tags, group)) {
      return []
    }

    const networksOfGroup = groupNetworks(group)

    return interfacesOf(vm).filter(iface => isOnNetworks(iface.netTags, networksOfGroup))
  }

  return { networks, networkById, interfacesOf, groupInterfaces, areInterfacesReady }
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
