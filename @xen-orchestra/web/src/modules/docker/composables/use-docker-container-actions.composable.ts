import { useDockerContainerActionError } from '@/modules/docker/composables/use-docker-container-action-error.composable.ts'
import { useDockerContainerDelete } from '@/modules/docker/composables/use-docker-container-delete.composable.ts'
import { useDockerErrorMessage } from '@/modules/docker/composables/use-docker-error-message.composable.ts'
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
  shouldConfirmContainerStop,
} from '@/modules/docker/utils/xo-docker.util.ts'
import type { IconName } from '@core/icons'
import type { ActionItem } from '@core/tables/column-definitions/action-column.ts'
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
 * state (`getContainerActions`).
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

  const { deleteDockerContainer, isDeletingDockerContainer } = useDockerContainerDelete(container, { onSettled })

  const { dockerContainerActionError, clearDockerContainerActionError } = useDockerContainerActionError()

  const { getDockerErrorMessage } = useDockerErrorMessage()

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

  async function execute(action: XoDockerContainerAction) {
    clearDockerContainerActionError()

    try {
      await jobs[action].run()
    } catch (error) {
      dockerContainerActionError.value = {
        containerName: getContainerDisplayName(container.value),
        action: labels.value[action],
        message: getDockerErrorMessage(error),
      }
    } finally {
      onSettled?.()
    }
  }

  const { open: openStopModal } = useOverlay({
    component: () => import('@/modules/docker/components/modal/DockerContainerStopModal.vue'),
    events: {
      onConfirm: () => execute('stop'),
      onCancel: true,
    },
  })

  function runDockerContainerAction(action: XoDockerContainerAction) {
    if (action === 'stop' && shouldConfirmContainerStop(container.value)) {
      return openStopModal({
        props: {
          name: getContainerDisplayName(container.value),
          policy: container.value.restartPolicy?.name ?? '',
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
          action,
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
    deleteDockerContainer,
    primaryAction,
    dockerContainerActionItems,
    isDockerContainerBusy,
  }
}
