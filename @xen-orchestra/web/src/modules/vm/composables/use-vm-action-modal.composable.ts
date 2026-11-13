import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { VmActions } from '@core/types/object.type.ts'
import { useActionModal } from '@core/composables/modals/use-action-modal.ts'
import { useI18n } from 'vue-i18n'

export function useVmActionModal() {
  const { t } = useI18n()

  const { open } = useActionModal()

  function openVmActionModal(action: VmActions, vms: FrontXoVm[], onConfirm: () => void) {
    return open({
      props: {
        accent: 'info',
        action,
        object: 'vm',
        vmCount: vms.length,
        icon: 'status:info-picto',
        confirmationText: vms.length > 1 ? t('n-vms', { n: vms.length }) : undefined,
      },
      events: {
        onConfirm,
      },
    })
  }

  return {
    openVmActionModal,
  }
}
