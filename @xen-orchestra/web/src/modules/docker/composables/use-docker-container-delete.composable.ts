import { useDockerContainerActionError } from '@/modules/docker/composables/use-docker-container-action-error.composable.ts'
import { useDockerErrorMessage } from '@/modules/docker/composables/use-docker-error-message.composable.ts'
import { useXoDockerContainerDeleteJob } from '@/modules/docker/jobs/xo-docker-container-delete.job.ts'
import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import { getContainerDisplayName } from '@/modules/docker/utils/xo-docker.util.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Deletes a container after a confirmation. There is no container page to
 * redirect away from: the selection (`?id=`) is cleared instead.
 */
export function useDockerContainerDelete(
  rawContainer: MaybeRefOrGetter<FrontXoDockerContainer>,
  { onSettled }: { onSettled?: () => void } = {}
) {
  const container = toComputed(rawContainer)

  const { t } = useI18n()

  const { run, isRunning: isDeletingDockerContainer } = useXoDockerContainerDeleteJob(container)

  const { dockerContainerActionError, clearDockerContainerActionError } = useDockerContainerActionError()

  const { getDockerErrorMessage } = useDockerErrorMessage()

  const selectedContainerId = useRouteQuery('id')

  const { open } = useDeleteModal()

  function deleteDockerContainer() {
    const deleted = container.value
    const name = getContainerDisplayName(deleted)

    return open({
      events: {
        onConfirm: async () => {
          clearDockerContainerActionError()

          try {
            await run()

            if (selectedContainerId.value === deleted.id) {
              selectedContainerId.value = ''
            }
          } catch (error) {
            dockerContainerActionError.value = {
              containerName: name,
              action: t('action:delete'),
              message: getDockerErrorMessage(error),
            }
          } finally {
            onSettled?.()
          }
        },
      },
      props: {
        subject: name,
        description: t('docker-container-delete-description'),
        confirmLabel: t('action:delete-n-containers', { n: 1 }),
      },
    })
  }

  return {
    deleteDockerContainer,
    isDeletingDockerContainer,
  }
}
