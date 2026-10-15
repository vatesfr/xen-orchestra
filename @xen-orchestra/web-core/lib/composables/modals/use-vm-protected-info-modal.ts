import { useInfoModal } from '@core/composables/modals/use-info-modal.ts'
import { useI18n } from 'vue-i18n'

export function useVmProtectedInfoModal() {
  const { t } = useI18n()

  const { open: openInfoModal, abort } = useInfoModal()

  function open() {
    return openInfoModal({
      props: {
        title: t('what-does-protected-mean?'),
        content: t('what-does-protected-mean-content'),
      },
    })
  }

  return { open, abort }
}
