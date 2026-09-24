import { useInfoModal } from '@core/composables/modals/use-info-modal.ts'
import { useI18n } from 'vue-i18n'

export function useDisabledHostInfoModal() {
  const { t } = useI18n()

  const { open: openInfoModal, abort } = useInfoModal()

  function open() {
    return openInfoModal({
      props: {
        title: t('what-is-a-disabled-host?'),
        content: t('what-is-a-disabled-host-content'),
      },
    })
  }

  return { open, abort }
}
