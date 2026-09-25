import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoDockerLogs } from '@vates/types'
import type { Ref } from 'vue'

export const DOCKER_LOGS_TAIL = 50

export const DOCKER_LOGS_POLLING_INTERVAL_MS = 10e3

/**
 * Last lines of the logs of a container, fetched live over SSH.
 *
 * Use it only in a component mounted while a container is selected: a
 * parameterized resource registers its URL even when it is disabled.
 */
export const useXoDockerContainerLogs = defineRemoteResource({
  url: (containerId: FrontXoDockerContainer['id']) =>
    `${BASE_URL}/docker-containers/${encodeURIComponent(containerId)}/logs?tail=${DOCKER_LOGS_TAIL}`,
  pollingIntervalMs: DOCKER_LOGS_POLLING_INTERVAL_MS,
  // a new tail each time: assign, a deep merge would keep the entries of a longer previous answer
  onDataReceived: async (data: Ref<XoDockerLogs | undefined>, receivedData) => {
    data.value = receivedData
  },
  state: (dockerContainerLogs: Ref<XoDockerLogs | undefined>, context) => ({
    dockerContainerLogs,
    areDockerContainerLogsReady: context.isReady,
    hasDockerContainerLogsError: context.hasError,
  }),
})
