import type { FrontXoTask } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { fetchPost, fetchRequest } from '@/shared/utils/fetch.util.ts'
import type { UpgradablePackage } from '@vates/types'
import { onMounted, ref, watch } from 'vue'

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
  const activeTaskId = ref<FrontXoTask['id'] | undefined>()

  const { getTaskById } = useXoTaskCollection()

  // Watch the active upgrade task; refresh the package list when it ends
  watch(
    () => (activeTaskId.value !== undefined ? getTaskById(activeTaskId.value) : undefined),
    task => {
      if (task === undefined || task.status === 'pending') return
      isLoading.value = false
      activeTaskId.value = undefined
      fetchUpdates().catch(err => console.warn('Failed to refresh package list after upgrade', err))
    }
  )

  async function applyUpdatesResponse(data: UpdatesResponse): Promise<void> {
    patches.value = data.packages
    isRestartNeeded.value = data.isRebootRequired
  }

  async function fetchUpdates(): Promise<void> {
    const data = await fetchRequest<UpdatesResponse>('xoa/updates')
    await applyUpdatesResponse(data)
  }

  async function refreshList(): Promise<void> {
    isLoading.value = true
    try {
      const data = await fetchPost<UpdatesResponse>('xoa/updates/refresh')
      await applyUpdatesResponse(data)
    } finally {
      isLoading.value = false
    }
  }

  async function startUpgradeTask(endpoint: string): Promise<void> {
    isLoading.value = true
    const { taskId } = await fetchPost<{ taskId: FrontXoTask['id'] }>(endpoint)
    activeTaskId.value = taskId
  }

  async function upgradePatch(name: string): Promise<void> {
    await startUpgradeTask(`xoa/updates/packages/${encodeURIComponent(name)}/upgrade`)
  }

  async function upgradeAll(): Promise<void> {
    await startUpgradeTask('xoa/updates/upgrade')
  }

  async function upgradeDistro(): Promise<void> {
    await startUpgradeTask('xoa/updates/dist-upgrade')
  }

  async function restartXo(): Promise<void> {
    // implemented later
  }

  onMounted(async () => {
    isLoading.value = true
    try {
      await fetchUpdates()
    } finally {
      isLoading.value = false
    }
  })

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
