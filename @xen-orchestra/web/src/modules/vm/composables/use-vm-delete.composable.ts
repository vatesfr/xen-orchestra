import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import { useXoVmDeleteJob } from '@/modules/vm/jobs/xo-vm-delete.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { extractVmHostId } from '@/modules/vm/utils/xo-vm.util.ts'
import { useBlockedModal } from '@core/composables/modals/use-blocked-modal.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useRedirectAfterDelete } from '@core/composables/redirect-after-delete.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

export function useVmDelete(rawVm: MaybeRefOrGetter<FrontXoVm>) {
  const vm = toComputed(rawVm)

  const { t } = useI18n()

  const { run, canRun, isRunning: isDeletingVm } = useXoVmDeleteJob(() => [vm.value])

  const { xo5VmAdvancedHref } = useXoVmUtils(vm)

  const route = useRoute()

  const { redirectIfOnObjectPage } = useRedirectAfterDelete({
    isOnObjectPage: () => route.name?.includes('/vm/') ?? false,
    redirectTo: () => {
      const hostId = extractVmHostId(vm.value)

      if (hostId !== undefined) {
        return { name: '/host/[id]/vms', params: { id: hostId } }
      }

      return { name: '/pool/[id]/vms', params: { id: vm.value.$pool } }
    },
  })

  const { open: openDeleteModal } = useDeleteModal()

  const { open: openBlockedModal } = useBlockedModal()

  function deleteVm() {
    if (!canRun.value) {
      return openBlockedModal({
        props: {
          blockedOperation: 'destroy',
          href: xo5VmAdvancedHref.value,
        },
      })
    }

    return openDeleteModal({
      props: {
        subject: vm.value.name_label,
        description: t('vm-delete-warning'),
        confirmLabel: t('action:delete-n-vms', { n: 1 }),
      },
      events: {
        onConfirm: () => run({ detached: true, onSuccess: redirectIfOnObjectPage }),
      },
    })
  }

  return { deleteVm, isDeletingVm }
}
