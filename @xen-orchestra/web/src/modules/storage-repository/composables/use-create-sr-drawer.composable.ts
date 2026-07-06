import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { type NewSrRestPayload, useXoSrCreateJob } from '@/modules/storage-repository/jobs/xo-sr-create.job.ts'
import { useDrawer } from '@core/packages/drawer/use-drawer.ts'
import { ref } from 'vue'

export type CreateSrDrawerContext = {
  poolId: FrontXoPool['id']
  hostId?: FrontXoHost['id']
}

export function useCreateSrDrawer() {
  const payload = ref<NewSrRestPayload>()

  const { run, isRunning, errorMessage, canRun } = useXoSrCreateJob(payload)

  const openCreateSrDrawer = useDrawer((context: CreateSrDrawerContext) => ({
    component: import('@/modules/storage-repository/components/drawer/StorageRepositoryCreateDrawer.vue'),
    props: context,
    onConfirm: async (restPayload: NewSrRestPayload) => {
      payload.value = restPayload

      try {
        const [result] = await run()

        if (!result || result.status === 'rejected') {
          console.error(`Failed to create SR ${restPayload.name_label}`)
        }
      } catch (error) {
        console.error('Error when creating SR:', error)
      }
    },
  }))

  return { openCreateSrDrawer, canRun, isRunning, errorMessage }
}
