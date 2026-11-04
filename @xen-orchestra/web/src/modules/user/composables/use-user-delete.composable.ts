import { useXoUserDeleteJob } from '@/modules/user/jobs/xo-user-delete.job.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useUserDelete(rawUsers: MaybeRefOrGetter<FrontXoUser[]>) {
  const users = toComputed(rawUsers)

  const { t } = useI18n()

  const selectedUserId = useRouteQuery('id')

  const {
    run,
    canRun: canDeleteUsers,
    isRunning: isDeletingUsers,
    errorMessage: deleteUsersErrorMessage,
  } = useXoUserDeleteJob(users)

  const { open } = useDeleteModal()

  function confirmDelete() {
    const userIds = users.value.map(user => user.id)

    run({
      detached: true,
      onSuccess: results => {
        const isSelectedUserDeleted = results.some(
          (result, index) => result.status === 'fulfilled' && userIds[index] === selectedUserId.value
        )

        if (isSelectedUserDeleted) {
          selectedUserId.value = ''
        }
      },
    })
  }

  function deleteUsers() {
    const count = users.value.length

    return open({
      events: {
        onConfirm: confirmDelete,
      },
      props: {
        subject: t('n-users', { n: count }),
        description: t('user:delete-warning', { n: count }),
        confirmLabel: t('action:delete-n-users', { n: count }),
      },
    })
  }

  return { deleteUsers, canDeleteUsers, isDeletingUsers, deleteUsersErrorMessage }
}
