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

  function deleteRoles() {
    const count = roles.value.length

    return open({
      events: {
        onConfirm: async () => {
          try {
            const isSelectedRoleDeleted = roles.value.some(role => role.id === selectedRoleId.value)

            await run()

            if (isSelectedRoleDeleted) {
              selectedRoleId.value = ''
            }
          } catch (error) {
            console.error('Error when deleting role:', error)
          }
        },
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
