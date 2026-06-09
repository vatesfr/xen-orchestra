import { useXoVdiMigrateJob } from '@/modules/vdi/jobs/xo-vdi-migrate.job.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { ref, type MaybeRefOrGetter } from 'vue'

export function useVdiMigrateModal(rawVdi: MaybeRefOrGetter<FrontXoVdi>) {
  const vdi = toComputed(rawVdi)
  const targetSrId = ref<string | undefined>(undefined)

  const { run, canRun, isRunning, errorMessage } = useXoVdiMigrateJob(vdi, targetSrId)

  const openModal = useModal(() => ({
    component: import('@/modules/vdi/components/modal/VdiMigrateModal.vue'),
    props: { vdi: vdi.value, isRunning: isRunning.value },
    onConfirm: async (srId: string) => {
      try {
        targetSrId.value = srId
        await run()
      } catch (error) {
        console.error('Error when migrating VDI:', error)
      }
    },
  }))

  return { openModal, canRun, isRunning, errorMessage }
}
