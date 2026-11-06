import { useXoRoleDeleteJob } from '@/modules/role/jobs/xo-role-delete.job.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useRoleDelete(rawRoles: MaybeRefOrGetter<FrontXoRole[]>) {
  const roles = toComputed(rawRoles)

  const { t } = useI18n()

  const selectedRoleId = useRouteQuery('id')

  const {
    run,
    canRun: canDeleteRoles,
    isRunning: isDeletingRoles,
    errorMessage: deleteRolesErrorMessage,
  } = useXoRoleDeleteJob(roles)

  const { open } = useDeleteModal()

  function confirmDelete() {
    const roleIds = roles.value.map(role => role.id)

    run({
      detached: true,
      onSuccess: results => {
        const isSelectedRoleDeleted = results.some(
          (result, index) => result.status === 'fulfilled' && roleIds[index] === selectedRoleId.value
        )

        if (isSelectedRoleDeleted) {
          selectedRoleId.value = ''
        }
      },
    })
  }

  function deleteRoles() {
    const count = roles.value.length

    return open({
      events: {
        onConfirm: confirmDelete,
      },
      props: {
        subject: t('n-roles', { n: count }),
        description: t('role:delete-warning', { n: count }),
        confirmLabel: t('action:delete-n-roles', { n: count }),
      },
    })
  }

  return { deleteRoles, canDeleteRoles, isDeletingRoles, deleteRolesErrorMessage }
}
