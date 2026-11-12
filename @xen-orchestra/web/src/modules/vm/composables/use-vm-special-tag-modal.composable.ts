import { isNoBakVmTag } from '@/modules/vm/utils/xo-vm.util.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { useI18n } from 'vue-i18n'

export type VmSpecialTagAction = 'add' | 'remove'

export function useVmSpecialTagModal() {
  const { t } = useI18n()

  const { open } = useOverlay({
    component: () => import('@/modules/vm/components/tags/VmSpecialTagModal.vue'),
    events: {
      onConfirm: true,
      onCancel: true,
    },
  })

  function getTexts(tag: string, action: VmSpecialTagAction) {
    const confirmLabel = action === 'add' ? t('action:add-tag') : t('action:remove-tag')

    if (isNoBakVmTag(tag)) {
      return action === 'add'
        ? {
            title: t('vm-tag:exclude-from-backups?'),
            description: t('vm-tag:no-bak-add-description', { tag }),
            confirmLabel,
          }
        : {
            title: t('vm-tag:back-up-again?'),
            description: t('vm-tag:no-bak-remove-description', { tag }),
            confirmLabel,
          }
    }

    return {
      title: action === 'add' ? t('vm-tag:add-special-tag?', { tag }) : t('vm-tag:remove-special-tag?', { tag }),
      description: t('vm-tag:special-tag-description'),
      confirmLabel,
    }
  }

  function openSpecialTagModal(tag: string, action: VmSpecialTagAction, onConfirm: () => void) {
    return open({
      props: getTexts(tag, action),
      events: { onConfirm },
    })
  }

  return { openSpecialTagModal }
}
