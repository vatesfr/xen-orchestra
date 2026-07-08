import { useXoVdiDeleteJob } from '@/modules/vdi/jobs/xo-vdi-delete.job.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVdiDeleteModal(
  rawVdis: MaybeRefOrGetter<FrontXoVdi[]>,
  rawVm: MaybeRefOrGetter<FrontXoVm | undefined>
) {
  const vdis = toComputed(rawVdis)
  const vm = toComputed(rawVm)

  const { t } = useI18n()

  const { run, canRun, isRunning, errorMessage } = useXoVdiDeleteJob(vdis, vm)

  const { open } = useDeleteModal()

  function openModal() {
    const count = vdis.value.length

    return open({
      events: {
        onConfirm: async () => {
          try {
            await run()
          } catch (error) {
            console.error('Error when deleting VDI:', error)
          }
        },
      },
      props: {
        subject: t('n-vdis', { n: count }),
        description: t('vdi-delete-warning'),
        confirmLabel: t('action:delete-n-vdis', { n: count }),
      },
    })
  }

  return { openModal, canRun, isRunning, errorMessage }
}
