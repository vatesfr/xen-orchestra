import { xoDockerEngineArg } from '@/modules/docker/jobs/xo-docker-args.ts'
import type { FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

/**
 * Forgets the SSH connection to a Docker engine: the containers are not touched
 */
export const useXoDockerConnectionDeleteJob = defineJob('docker-connection.delete', [xoDockerEngineArg], () => {
  const { t } = useI18n()

  return {
    run(engine: FrontXoDockerEngine) {
      return fetchDelete(`docker-engines/${engine.id}`)
    },

    validate(isRunning, engine) {
      if (engine === undefined) {
        throw new JobError(t('job:docker-connection-delete:missing-engine'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:delete:in-progress'))
      }
    },
  }
})
