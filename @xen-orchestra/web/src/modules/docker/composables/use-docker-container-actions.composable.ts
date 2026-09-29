import { useDockerContainerActionError } from '@/modules/docker/composables/use-docker-container-action-error.composable.ts'
import { useDockerErrorMessage } from '@/modules/docker/composables/use-docker-error-message.composable.ts'
import { useXoDockerContainerDeleteJob } from '@/modules/docker/jobs/xo-docker-container-delete.job.ts'
import {
  useXoDockerContainerPauseJob,
  useXoDockerContainerRestartJob,
  useXoDockerContainerStartJob,
  useXoDockerContainerStopJob,
  useXoDockerContainerUnpauseJob,
} from '@/modules/docker/jobs/xo-docker-container-lifecycle.jobs.ts'
import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import {
  canDeleteContainer,
  getContainerActions,
  getContainerDisplayName,
  getContainerPrimaryAction,
  getStopConfirmedRestartPolicy,
} from '@/modules/docker/utils/xo-docker.util.ts'
import type { IconName } from '@core/icons'
import type { ActionItem } from '@core/tables/column-definitions/action-column.ts'
import { useDeleteModal } from '@core/composables/modals/use-delete-modal.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoDockerContainerAction } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export const DOCKER_CONTAINER_ACTION_ICONS: Record<XoDockerContainerAction, IconName> = {
  start: 'fa:play',
  stop: 'fa:stop',
  restart: 'action:reboot',
  pause: 'fa:pause',
  unpause: 'fa:play',
}

/**
 * Lifecycle actions and deletion of a container, available according to its
 * state (`getContainerActions`). There is no container page to redirect away
 * from on deletion: the selection (`?id=`) is cleared instead.
 *
 * No optimistic update: the resulting state is not predictable (a stopped
 * container exits with 0 or 137…) and the list is a cache shared by every
 * subscriber. `onSettled` must refetch the containers (and the engine info).
 */
export function useDockerContainerActions(
  rawContainer: MaybeRefOrGetter<FrontXoDockerContainer>,
  { onSettled }: { onSettled?: () => void } = {}
) {
  const container = toComputed(rawContainer)

  const { t } = useI18n()

  const jobs = {
    start: useXoDockerContainerStartJob(container),
    stop: useXoDockerContainerStopJob(container),
    restart: useXoDockerContainerRestartJob(container),
    pause: useXoDockerContainerPauseJob(container),
    unpause: useXoDockerContainerUnpauseJob(container),
  } satisfies Record<XoDockerContainerAction, unknown>

  const deleteJob = useXoDockerContainerDeleteJob(container)

  const isDeletingDockerContainer = deleteJob.isRunning

  const { dockerContainerActionError, clearDockerContainerActionError } = useDockerContainerActionError()

  const { getDockerErrorMessage } = useDockerErrorMessage()

  async function report(containerName: string, action: string, run: () => Promise<unknown>) {
    clearDockerContainerActionError()

    try {
      await run()
    } catch (error) {
      dockerContainerActionError.value = { containerName, action, message: getDockerErrorMessage(error) }
    } finally {
      onSettled?.()
    }
  }

  const labels = computed<Record<XoDockerContainerAction, string>>(() => ({
    start: t('action:start'),
    stop: t('action:stop'),
    restart: t('action:restart'),
    pause: t('action:pause'),
    unpause: t('action:unpause'),
  }))

  const isDockerContainerBusy = computed(
    () => isDeletingDockerContainer.value || Object.values(jobs).some(job => job.isRunning.value)
  )

  function execute(action: XoDockerContainerAction) {
    return report(getContainerDisplayName(container.value), labels.value[action], () => jobs[action].run())
  }

  const selectedContainerId = useRouteQuery('id')

  const { open: openDeleteModal } = useDeleteModal()

  function deleteDockerContainer() {
    const deleted = container.value
    const name = getContainerDisplayName(deleted)

    return openDeleteModal({
      events: {
        onConfirm: () =>
          report(name, t('action:delete'), async () => {
            await deleteJob.run()

            if (selectedContainerId.value === deleted.id) {
              selectedContainerId.value = ''
            }
          }),
      },
      props: {
        subject: name,
        description: t('docker-container-delete-description'),
        confirmLabel: t('action:delete-n-containers', { n: 1 }),
      },
    })
  }

  const { open: openStopModal } = useOverlay({
    component: () => import('@/modules/docker/components/modal/DockerContainerStopModal.vue'),
    events: {
      onConfirm: () => execute('stop'),
      onCancel: true,
    },
  })

  function runDockerContainerAction(action: XoDockerContainerAction) {
    const policy = action === 'stop' ? getStopConfirmedRestartPolicy(container.value) : undefined

    if (policy !== undefined) {
      return openStopModal({
        props: {
          name: getContainerDisplayName(container.value),
          policy,
        },
      })
    }

    return execute(action)
  }

  const availableActions = computed(() => getContainerActions(container.value.state))

  const primaryAction = computed(() => {
    const action = getContainerPrimaryAction(container.value.state)

    return action === undefined
      ? undefined
      : {
          label: labels.value[action],
          icon: DOCKER_CONTAINER_ACTION_ICONS[action],
          busy: jobs[action].isRunning.value,
          disabled: isDockerContainerBusy.value,
          run: () => runDockerContainerAction(action),
        }
  })

  const deleteActionItem = computed<ActionItem>(() => {
    const canDelete = canDeleteContainer(container.value.state)

    return {
      label: t('action:delete'),
      icon: 'action:delete',
      accent: 'danger',
      busy: isDeletingDockerContainer.value,
      disabled: !canDelete || (isDockerContainerBusy.value && !isDeletingDockerContainer.value),
      hint: canDelete ? undefined : t('docker-container-stop-before-delete'),
      onClick: () => deleteDockerContainer(),
    }
  })

  const dockerContainerActionItems = computed<ActionItem[]>(() => [
    ...availableActions.value.map(action => {
      const busy = jobs[action].isRunning.value

      return {
        label: labels.value[action],
        icon: DOCKER_CONTAINER_ACTION_ICONS[action],
        busy,
        disabled: isDockerContainerBusy.value && !busy,
        onClick: () => runDockerContainerAction(action),
      } satisfies ActionItem
    }),
    deleteActionItem.value,
  ])

  return {
    runDockerContainerAction,
    primaryAction,
    dockerContainerActionItems,
    isDockerContainerBusy,
  }
}
