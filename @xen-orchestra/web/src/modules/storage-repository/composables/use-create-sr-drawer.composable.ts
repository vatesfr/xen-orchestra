import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { type NewSrRestPayload, useXoSrCreateJob } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { ref } from 'vue'

export type CreateSrDrawerContext = {
  poolId: FrontXoPool['id']
  hostId?: FrontXoHost['id']
}

export function useCreateSrDrawer() {
  const payload = ref<NewSrRestPayload>()

  const { run, isRunning, errorMessage, canRun } = useXoSrCreateJob(payload)

  const { open: openDrawer } = useOverlay({
    component: () => import('@/modules/storage-repository/components/drawer/StorageRepositoryCreateDrawer.vue'),
    events: {
      onConfirm: async (restPayload: NewSrRestPayload) => {
        payload.value = restPayload

        try {
          const [result] = await run()

          if (!result || result.status === 'rejected') {
            console.error(`Failed to create SR ${restPayload.name_label}`)
            return KEEP_OVERLAY_OPEN
          }
        } catch (error) {
          console.error('Error when creating SR:', error)
          return KEEP_OVERLAY_OPEN
        }
      },
      onCancel: true,
    },
  })

  function openCreateSrDrawer(context: CreateSrDrawerContext) {
    return openDrawer({ props: context })
  }

  return { openCreateSrDrawer, canRun, isRunning, errorMessage }
}
