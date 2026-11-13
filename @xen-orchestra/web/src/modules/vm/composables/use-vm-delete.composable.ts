import { useXoVmDeleteJob } from '@/modules/vm/jobs/xo-vm-delete.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { extractVmHostId } from '@/modules/vm/utils/xo-vm.util.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useTypeToConfirmModal } from '@core/composables/modals/use-type-to-confirm-modal.ts'
import { useRedirectAfterDelete } from '@core/composables/redirect-after-delete.composable.ts'
import { useUnselectAfterDelete } from '@core/composables/unselect-after-delete.composable.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

export function useVmDelete(rawVms: MaybeRefOrGetter<FrontXoVm[]>) {
  const vms = toComputed(rawVms)

  const { t } = useI18n()

  const { unselectIfDeleted } = useUnselectAfterDelete()

  const protectedVms = computed(() => vms.value.filter(vm => vm.blockedOperations.destroy))

  const deletableVms = computed(() => vms.value.filter(vm => !vm.blockedOperations.destroy))

  const { run, isRunning: isDeletingVms, errorMessage } = useXoVmDeleteJob(deletableVms)

  const route = useRoute<'/vm/[id]'>()

  let deletedVmOfCurrentPage: FrontXoVm | undefined

  const { redirectIfOnObjectPage } = useRedirectAfterDelete({
    isOnObjectPage: () => deletedVmOfCurrentPage !== undefined,
    redirectTo: () => {
      if (deletedVmOfCurrentPage === undefined) {
        return undefined
      }

      const hostId = extractVmHostId(deletedVmOfCurrentPage)

      if (hostId !== undefined) {
        return { name: '/host/[id]/vms', params: { id: hostId } }
      }

      return { name: '/pool/[id]/vms', params: { id: deletedVmOfCurrentPage.$pool } }
    },
  })

  const deleteVmsErrorMessage = computed(() =>
    vms.value.length > 0 && deletableVms.value.length === 0 ? t('job:vm-delete:blocked-operation') : errorMessage.value
  )

  const canDeleteVms = computed(() => deleteVmsErrorMessage.value === undefined)

  function deleteSelectedVms() {
    const vmIds = deletableVms.value.map(vm => vm.id)

    deletedVmOfCurrentPage = deletableVms.value.find(vm => vm.id === route.params.id)

    run({
      detached: true,
      onSuccess: async results => {
        unselectIfDeleted(vmIds, results)

        await redirectIfOnObjectPage(results)
      },
    })
  }

  const { open: openDeleteModal } = useDeleteModal()

  const { open: openTypeToConfirmModal } = useTypeToConfirmModal()

  const { open: openPartialDeletionDrawer } = useOverlay({
    component: () => import('@/modules/vm/components/drawer/VmPartialDeletionDrawer.vue'),
    events: {
      onConfirm: deleteSelectedVms,
      onCancel: true,
    },
  })

  function deleteVms() {
    if (protectedVms.value.length > 0) {
      return openPartialDeletionDrawer({
        props: {
          deletableVms: deletableVms.value,
          protectedVms: protectedVms.value,
        },
      })
    }

    const count = deletableVms.value.length

    if (count === 1) {
      return openDeleteModal({
        props: {
          accent: 'danger',
          subject: deletableVms.value[0].name_label,
          description: t('vm-delete-warning'),
          confirmLabel: t('action:delete-n-vms', { n: 1 }),
        },
        events: {
          onConfirm: deleteSelectedVms,
        },
      })
    }

    return openTypeToConfirmModal({
      props: {
        accent: 'danger',
        icon: 'status:danger-picto',
        title: t('modal:vm-delete-title', { n: count }),
        description: t('modal:vms-delete-message', { n: count }),
        confirmationText: t('n-vms', { n: count }),
        confirmLabel: t('action:delete-n-vms', { n: count }),
      },
      events: {
        onConfirm: deleteSelectedVms,
      },
    })
  }

  return {
    deleteVms,
    canDeleteVms,
    isDeletingVms,
    deleteVmsErrorMessage,
  }
}
