import { xoDockerEngineArg } from '@/modules/docker/jobs/xo-docker-args.ts'
import type { FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoDockerEngineTestResult } from '@vates/types'
import { useI18n } from 'vue-i18n'

/**
 * Tests the SSH connection to an engine and its Docker socket, bypassing the
 * negative cache. May be refused with a 429 `SSH_COOLDOWN` right after a
 * failed authentication.
 */
export const useXoDockerEngineTestJob = defineJob('docker-engine.test', [xoDockerEngineArg], () => {
  const { t } = useI18n()

  return {
    run(engine: FrontXoDockerEngine) {
      return fetchPost<XoDockerEngineTestResult>(`docker-engines/${engine.id}/actions/test?sync=true`)
    },

    validate(isRunning, engine) {
      if (engine === undefined) {
        throw new JobError(t('job:docker-engine-test:missing-engine'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:docker-engine-test:in-progress'))
      }
    },
  }
})
