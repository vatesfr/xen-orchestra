import { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import type { VdfDocument } from '@/modules/vdf/types.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

function ipv4ToNumber(ip: string) {
  const parts = ip.split('.')

  if (parts.length !== 4 || parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) {
    return undefined
  }

  return parts.reduce((value, part) => value * 256 + Number(part), 0)
}

// Whether an address is a group's static member: the same address, or in
// its IPv4 network (IPv6 networks only match exactly)
export function ipMatches(ip: string, member: string) {
  const [network, rawLength] = member.split('/')

  if (rawLength === undefined || network === ip) {
    return network === ip
  }

  const address = ipv4ToNumber(ip)
  const base = ipv4ToNumber(network)
  const length = Number(rawLength)

  if (address === undefined || base === undefined || !(length >= 0 && length <= 32)) {
    return false
  }

  const size = 2 ** (32 - length)

  return Math.floor(address / size) === Math.floor(base / size)
}

// Who an IP seen on the wire is: a VM (by the addresses its guest reports)
// and the groups listing it as a static member
export function useVdfIpNames(rawDocument: MaybeRefOrGetter<VdfDocument>) {
  const { vms } = useXoVmCollection()

  // as agents count them: an address the guest reports for a device with
  // no interface names nothing
  const { vmAddresses } = useVdfInterfaces()

  const vmByIp = computed(() => {
    const byIp = new Map<string, FrontXoVm>()

    // running VMs last, so they win: a halted VM keeps the addresses its
    // guest last reported, which DHCP may have handed to another VM since
    const running = (vm: FrontXoVm) => (vm.power_state === 'Running' ? 1 : 0)

    for (const vm of [...vms.value].sort((vmA, vmB) => running(vmA) - running(vmB))) {
      for (const ip of vmAddresses(vm)) {
        byIp.set(ip, vm)
      }
    }

    return byIp
  })

  const vmByName = computed(() => new Map(vms.value.map(vm => [vm.name_label, vm])))

  const staticMembers = computed(() =>
    Object.entries(toValue(rawDocument).groups).flatMap(([name, group]) =>
      (group.ips ?? []).map(member => ({ name, member }))
    )
  )

  function groupsOfIp(ip: string) {
    return [...new Set(staticMembers.value.filter(({ member }) => ipMatches(ip, member)).map(({ name }) => name))]
  }

  return { vmByIp, vmByName, groupsOfIp }
}
