import { xoDockerContainerArg } from '@/modules/docker/jobs/xo-docker-args.ts'
import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import { getContainerActions } from '@/modules/docker/utils/xo-docker.util.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoDockerContainerAction } from '@vates/types'
import { useI18n } from 'vue-i18n'

/**
 * One job per lifecycle action, from one factory: `defineJob` is a plain
 * function, so each call gets its own job id (and its own running state).
 *
 * `?sync=true`: the actions take well under a second on an open SSH
 * connection, faster than a task would reach the browser through the SSE
 * channel (`monitorTask` gives up after 2 s).
 */
function defineDockerContainerLifecycleJob(action: XoDockerContainerAction) {
  return defineJob(`docker-container.${action}`, [xoDockerContainerArg], () => {
    const { t } = useI18n()

    return {
      run(container: FrontXoDockerContainer) {
        return fetchPost<void>(`docker-containers/${encodeURIComponent(container.id)}/actions/${action}?sync=true`)
      },

      validate(isRunning, container) {
        if (container === undefined) {
          throw new JobError(t('job:docker-container:missing-container'))
        }

        if (isRunning) {
          throw new JobRunningError(t(`job:docker-container-${action}:in-progress`))
        }

        if (!getContainerActions(container.state).includes(action)) {
          throw new JobError(t('job:docker-container:bad-state'))
        }
      },
    }
  })
}

export const useXoDockerContainerStartJob = defineDockerContainerLifecycleJob('start')

export const useXoDockerContainerStopJob = defineDockerContainerLifecycleJob('stop')

export const useXoDockerContainerRestartJob = defineDockerContainerLifecycleJob('restart')

export const useXoDockerContainerPauseJob = defineDockerContainerLifecycleJob('pause')

export const useXoDockerContainerUnpauseJob = defineDockerContainerLifecycleJob('unpause')
