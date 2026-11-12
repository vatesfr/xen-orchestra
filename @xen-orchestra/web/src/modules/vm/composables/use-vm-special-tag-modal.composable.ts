import { VDF_QUARANTINE_TAG } from '@/modules/vdf/types.ts'
import { isVdfTag } from '@/modules/vdf/utils/vdf-group-tags.util.ts'
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

    if (tag === VDF_QUARANTINE_TAG) {
      return action === 'add'
        ? {
            title: t('vm-tag:quarantine-vm?'),
            description: t('vm-tag:quarantine-add-description', { tag }),
            confirmLabel,
          }
        : {
            title: t('vm-tag:lift-quarantine?'),
            description: t('vm-tag:quarantine-remove-description', { tag }),
            confirmLabel,
          }
    }

    if (isVdfTag(tag)) {
      return {
        title: action === 'add' ? t('vm-tag:add-firewall-tag?', { tag }) : t('vm-tag:remove-firewall-tag?', { tag }),
        description: t('vm-tag:firewall-tag-description', { tag }),
        confirmLabel,
      }
    }

    return {
      title: action === 'add' ? t('vm-tag:add-special-tag?', { tag }) : t('vm-tag:remove-special-tag?', { tag }),
      description: t('vm-tag:special-tag-description'),
      confirmLabel,
    }
  }

  const { open: openError } = useOverlay({
    component: () => import('@/modules/vm/components/tags/VmTagErrorModal.vue'),
    events: { onConfirm: true },
  })

  function openTagErrorModal(tag: string, action: VmSpecialTagAction, message: string) {
    return openError({
      props: {
        title: action === 'add' ? t('vm-tag:add-failed', { tag }) : t('vm-tag:remove-failed', { tag }),
        description: message,
      },
    })
  }

  function openSpecialTagModal(tag: string, action: VmSpecialTagAction, onConfirm: () => void) {
    return open({
      props: getTexts(tag, action),
      events: { onConfirm },
    })
  }

  return { openSpecialTagModal, openTagErrorModal }
}
