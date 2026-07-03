import { payloadsArg } from '@/modules/storage-repository/jobs/xo-sr-create-args.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import type { NewSrPayload, SrContentType } from '@core/types/storage-repository.type.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type NewSrRestPayload = {
  host: string
  name_label: string
  type: string
  shared: boolean
  device_config: Record<string, string>
  name_description?: string
  content_type?: SrContentType
}

export function buildNewSrPayload(payload: NewSrPayload): NewSrRestPayload {
  const restPayload: NewSrRestPayload = {
    host: payload.hostId,
    name_label: payload.nameLabel,
    type: payload.xapiType,
    shared: payload.shared,
    device_config: payload.deviceConfig,
    content_type: payload.contentType,
  }

  if (payload.nameDescription !== undefined) {
    restPayload.name_description = payload.nameDescription
  }

  return restPayload
}

export const useXoSrCreateJob = defineJob('sr.create', [payloadsArg], () => {
  const { t } = useI18n()

  return {
    async run(payloads) {
      const results = await Promise.allSettled(
        payloads.map(async payload => {
          const { id } = await fetchPost<{ id: string }>('srs', payload)
          return id
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to create SR ${payloads[index]?.name_label}:`, result.reason)
        }
      })

      return results
    },

    validate(isRunning, payloads) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payloads.length === 0) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      payloads.forEach(payload => {
        if (!payload.host) {
          throw new JobError(t('job:arg:host-required'))
        }

        if (!payload.name_label) {
          throw new JobError(t('job:arg:name-required'))
        }
      })
    },
  }
})
