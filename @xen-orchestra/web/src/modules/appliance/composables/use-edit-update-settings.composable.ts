import {
  type EditUpdateSettingsPayload,
  useXoaUpdateSettingsEditJob,
} from '@/modules/appliance/jobs/xoa-update-settings-edit.job.ts'
import { useXoaPackages } from '@/modules/appliance/remote-resources/use-xoa-packages.ts'
import { useXoaUpdateChannel } from '@/modules/appliance/remote-resources/use-xoa-update-channel.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { reactiveComputed } from '@vueuse/core'
import { ref } from 'vue'

export function useEditUpdateSettings() {
  const { channel, reloadChannel } = useXoaUpdateChannel()

  const { checkUpdates } = useXoaPackages()

  const payload = ref<EditUpdateSettingsPayload>()

  const { run, isRunning: isEditingUpdateSettings } = useXoaUpdateSettingsEditJob(payload)

  const { open } = useOverlay({
    component: () => import('@/modules/appliance/components/drawer/EditUpdateSettingsDrawer.vue'),
    events: {
      onConfirm: async (newPayload: EditUpdateSettingsPayload) => {
        payload.value = newPayload

        try {
          await run()
        } catch (error) {
          console.error('Error when editing the update settings', error)
          return KEEP_OVERLAY_OPEN
        }

        await reloadChannel()

        // les paquets disponibles dépendent du canal : pas d'await, la carte Version affiche la vérification en cours
        void checkUpdates()
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    channel: channel.value,
  }))

  function openEditUpdateSettingsDrawer() {
    return open({ props })
  }

  return {
    openEditUpdateSettingsDrawer,
    isEditingUpdateSettings,
  }
}
