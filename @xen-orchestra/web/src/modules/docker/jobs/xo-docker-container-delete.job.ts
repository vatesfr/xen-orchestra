import { xoDockerContainerArg } from '@/modules/docker/jobs/xo-docker-args.ts'
import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import { canDeleteContainer } from '@/modules/docker/utils/xo-docker.util.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

/**
 * Removes a stopped container (`DELETE /docker-containers/{id}`, always
 * synchronous). Its anonymous volumes are kept, like `docker rm`.
 */
export const useXoDockerContainerDeleteJob = defineJob('docker-container.delete', [xoDockerContainerArg], () => {
  const { t } = useI18n()

  return {
    run(container: FrontXoDockerContainer) {
      return fetchDelete(`docker-containers/${encodeURIComponent(container.id)}`)
    },

    validate(isRunning, container) {
      if (container === undefined) {
        throw new JobError(t('job:docker-container:missing-container'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }

      if (!canDeleteContainer(container.state)) {
        throw new JobError(t('job:docker-container-delete:bad-state'))
      }
    },
  }
})
