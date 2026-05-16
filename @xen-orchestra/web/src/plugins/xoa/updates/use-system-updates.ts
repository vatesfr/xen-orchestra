import type { XcpPatches } from '@vates/types/lib/xen-orchestra/xapi'
import { ref } from 'vue'

export type DistroUpgrade = {
  fromVersion: string
  toVersion: string
}

// STUB — replace with real websocket/event-driven implementation when backend lands
export function useSystemUpdates() {
  const patches = ref<XcpPatches[]>([
    {
      name: 'xcp-ng-xapi',
      version: '23.31.0',
      release: '2.xcpng8.3',
      description: 'XenAPI — the Xen management API and toolstack',
      license: 'LGPLv2.1',
      size: 2_345_678,
      url: 'https://updates.xcp-ng.org/packages/xcp-ng-xapi',
      changelog: {
        author: 'XCP-ng Team',
        date: 1_715_000_000,
        description: 'Fix VM migration timeout on large memory VMs',
      },
    },
    {
      name: 'xen-hypervisor',
      version: '4.17.4',
      release: '1.xcpng8.3',
      description: 'The Xen hypervisor',
      license: 'GPLv2',
      size: 8_765_432,
      url: 'https://updates.xcp-ng.org/packages/xen-hypervisor',
    },
    {
      name: 'sm',
      version: '2.30.5',
      release: '1.xcpng8.3',
      description: 'XCP-ng storage managers — handles SR creation and VDI operations',
      license: 'LGPLv2.1',
      size: 345_678,
      url: 'https://updates.xcp-ng.org/packages/sm',
    },
  ])

  const isLoading = ref(false)
  const isRestartNeeded = ref(true)
  const distroUpgrade = ref<DistroUpgrade | null>({ fromVersion: '12', toVersion: '13' })

  async function refreshList(): Promise<void> {
    isLoading.value = true
    await new Promise<void>(resolve => setTimeout(resolve, 800))
    isLoading.value = false
  }

  async function upgradePatch(_name: string): Promise<void> {}

  async function upgradeAll(): Promise<void> {}

  async function upgradeDistro(): Promise<void> {}

  async function restartXo(): Promise<void> {}

  return {
    patches,
    isLoading,
    isRestartNeeded,
    distroUpgrade,
    refreshList,
    upgradePatch,
    upgradeAll,
    upgradeDistro,
    restartXo,
  }
}
