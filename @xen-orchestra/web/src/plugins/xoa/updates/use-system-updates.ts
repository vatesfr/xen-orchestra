import { fetchPost, fetchRequest } from '@/shared/utils/fetch.util.ts'
import type { UpgradablePackage } from '@vates/types'
import { onMounted, ref } from 'vue'

export type DistroUpgrade = {
  fromVersion: string
  toVersion: string
}

type UpdatesResponse = {
  packages: UpgradablePackage[]
  isRebootRequired: boolean
}

export function useSystemUpdates() {
  const patches = ref<UpgradablePackage[]>([])
  const isLoading = ref(false)
  const isRestartNeeded = ref(false)
  const distroUpgrade = ref<DistroUpgrade | null>(null)

  async function fetchUpdates(): Promise<void> {
    isLoading.value = true
    try {
      const data = await fetchRequest<UpdatesResponse>('xoa/updates')
      patches.value = data.packages
      isRestartNeeded.value = data.isRebootRequired
    } finally {
      isLoading.value = false
    }
  }

  async function refreshList(): Promise<void> {
    isLoading.value = true
    try {
      const data = await fetchPost<UpdatesResponse>('xoa/updates/refresh')
      patches.value = data.packages
      isRestartNeeded.value = data.isRebootRequired
    } finally {
      isLoading.value = false
    }
  }

  async function upgradePatch(name: string): Promise<void> {
    await fetchPost(`xoa/updates/packages/${encodeURIComponent(name)}/upgrade`)
    await fetchUpdates()
  }

  async function upgradeAll(): Promise<void> {
    await fetchPost('xoa/updates/upgrade')
    await fetchUpdates()
  }

  async function upgradeDistro(): Promise<void> {
    await fetchPost('xoa/updates/dist-upgrade')
    await fetchUpdates()
  }

  async function restartXo(): Promise<void> {
    // implemented later
  }

  onMounted(fetchUpdates)

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
