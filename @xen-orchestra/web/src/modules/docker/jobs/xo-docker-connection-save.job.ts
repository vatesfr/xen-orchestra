import { type DockerConnectionSaveRequest, xoDockerConnectionSaveArg } from '@/modules/docker/jobs/xo-docker-args.ts'
import type { FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'
import { fetchPost, fetchRequest } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

/**
 * Creates (`POST /docker-engines`) or updates (`PATCH /docker-engines/{id}`) the
 * SSH connection to the Docker engine of a VM.
 *
 * Both connect first and are synchronous: an unknown or mismatching host key
 * is a 409 (`data.code: HOST_KEY_UNKNOWN | HOST_KEY_MISMATCH`), thrown as an
 * `ApiError` for the form to handle.
 */
export const useXoDockerConnectionSaveJob = defineJob('docker-connection.save', [xoDockerConnectionSaveArg], () => {
  const { t } = useI18n()

  return {
    async run(request: DockerConnectionSaveRequest): Promise<FrontXoDockerEngine['id']> {
      if (request.engineId !== undefined) {
        await fetchRequest(`docker-engines/${request.engineId}`, {
          method: 'PATCH',
          body: JSON.stringify(request.payload),
        })

        return request.engineId
      }

      const { id } = await fetchPost<{ id: FrontXoDockerEngine['id'] }>('docker-engines', request.payload)

      return id
    },

    validate(isRunning, request) {
      if (isRunning) {
        throw new JobRunningError(t('job:docker-connection-save:in-progress'))
      }

      if (request === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (request.payload.username === '') {
        throw new JobError(t('job:arg:username-required'))
      }
    },
  }
})
