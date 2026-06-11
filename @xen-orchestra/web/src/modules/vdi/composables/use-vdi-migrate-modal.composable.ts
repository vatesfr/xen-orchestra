import { useXoVdiMigrateJob } from '@/modules/vdi/jobs/xo-vdi-migrate.job.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, ref, type MaybeRefOrGetter } from 'vue'

export function useVdiMigrateModal(rawVdi: MaybeRefOrGetter<FrontXoVdi>) {
  const vdi = toComputed(rawVdi)

  const targetSrId = ref<string | undefined>(undefined)

  const { run, isRunning, errorMessage } = useXoVdiMigrateJob(() => [vdi.value], targetSrId)

  const canOpenModal = computed(() => {
    return !!vdi.value && !isRunning.value
  })

  const openModal = useModal(() => ({
    component: import('@/modules/vdi/components/modal/VdiMigrateModal.vue'),
    props: { vdi: vdi.value, isRunning: isRunning.value, errorMessage: errorMessage.value },
    onConfirm: async (srId: string) => {
      try {
        targetSrId.value = srId
        await run()
      } catch (error) {
        console.error(`Failed to migrate VDI ${vdi.value.id} to SR ${srId}:`, error)
      }
    },
  }))

  return { openModal, canRun: canOpenModal, isRunning, errorMessage }
}
