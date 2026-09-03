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
  const restPayload = ref<NewSrRestPayload>()

  const { run, isRunning, errorMessage, canRun } = useXoSrCreateJob(restPayload)

  const { open: openDrawer } = useOverlay({
    component: () => import('@/modules/storage-repository/components/drawer/StorageRepositoryCreateDrawer.vue'),
    events: {
      onConfirm: async (payload: NewSrRestPayload) => {
        restPayload.value = payload

        try {
          await run()
        } catch (error) {
          console.error(`Failed to create SR ${payload.name_label}: ${error}`)
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
