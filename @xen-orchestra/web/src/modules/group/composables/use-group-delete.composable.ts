import { useXoGroupDeleteJob } from '@/modules/group/jobs/xo-group-delete.job.ts'
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useGroupDelete(rawGroups: MaybeRefOrGetter<FrontXoGroup[]>) {
  const groups = toComputed(rawGroups)

  const { t } = useI18n()

  const selectedGroupId = useRouteQuery('id')

  const {
    run,
    canRun: canDeleteGroups,
    isRunning: isDeletingGroups,
    errorMessage: deleteGroupsErrorMessage,
  } = useXoGroupDeleteJob(groups)

  const { open } = useDeleteModal()

  function confirmDelete() {
    const groupIds = groups.value.map(group => group.id)

    run({
      detached: true,
      onSuccess: results => {
        const isSelectedGroupDeleted = results.some(
          (result, index) => result.status === 'fulfilled' && groupIds[index] === selectedGroupId.value
        )

        if (isSelectedGroupDeleted) {
          selectedGroupId.value = ''
        }
      },
    })
  }

  function deleteGroups() {
    const count = groups.value.length

    return open({
      events: {
        onConfirm: confirmDelete,
      },
      props: {
        subject: t('n-groups', { n: count }),
        description: t('group:delete-warning', { n: count }),
        confirmLabel: t('action:delete-n-groups', { n: count }),
      },
    })
  }

  return { deleteGroups, canDeleteGroups, isDeletingGroups, deleteGroupsErrorMessage }
}
