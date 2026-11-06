import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import { useVifDeleteJob } from '@/modules/vif/jobs/vif-delete.job.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useVifDelete(rawVif: MaybeRefOrGetter<XenApiVif>) {
  const vif = toComputed(rawVif)

  const { t } = useI18n()

  const {
    run,
    canRun: canDeleteVif,
    isRunning: isDeletingVif,
    errorMessage: deleteVifErrorMessage,
  } = useVifDeleteJob(vif)

  const { open } = useDeleteModal()

  function deleteVif() {
    return open({
      props: {
        subject: t('n-vifs', { n: 1 }),
        confirmLabel: t('action:delete-n-vifs', { n: 1 }),
      },
      events: {
        onConfirm: () => run({ detached: true }),
      },
    })
  }

  return { deleteVif, canDeleteVif, isDeletingVif, deleteVifErrorMessage }
}
