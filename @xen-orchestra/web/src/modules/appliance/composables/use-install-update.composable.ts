import type { InstallUpdatePayload } from '@/modules/appliance/form/install-update/use-install-update-form.ts'
import { useXoaSnapshotJob } from '@/modules/appliance/jobs/xoa-snapshot.job.ts'
import { useXoaUpgradeJob } from '@/modules/appliance/jobs/xoa-upgrade.job.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { reactiveComputed } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useInstallUpdate(
  versions: MaybeRefOrGetter<{
    channel: string
    currentVersion?: string
    nextVersion?: string
  }>,
  onUpgraded: () => void
) {
  const { run: runSnapshot, isRunning: isTakingSnapshot } = useXoaSnapshotJob()

  const { run: runUpgrade, isRunning: isUpgrading } = useXoaUpgradeJob()

  const isInstallingUpdate = computed(() => isTakingSnapshot.value || isUpgrading.value)

  async function installUpdate(payload: InstallUpdatePayload) {
    if (payload.snapshot) {
      try {
        await runSnapshot()
      } catch (error) {
        // sans snapshot, pas de retour arrière possible : on ne lance pas l'upgrade
        console.error('Failed to snapshot the appliance before the upgrade', error)
        return
      }
    }

    runUpgrade({ detached: true, onSuccess: onUpgraded })
  }

  const { open } = useOverlay({
    component: () => import('@/modules/appliance/components/drawer/InstallUpdateDrawer.vue'),
    events: {
      onConfirm: (payload: InstallUpdatePayload) => {
        void installUpdate(payload)
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => toValue(versions))

  function openInstallUpdateDrawer() {
    return open({ props })
  }

  return {
    openInstallUpdateDrawer,
    isInstallingUpdate,
  }
}
