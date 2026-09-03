import { payloadArg } from '@/modules/storage-repository/jobs/xo-sr-create-args.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import type { NewSrPayload, SrContentType } from '@core/types/storage-repository.type.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type NewSrRestPayload = {
  hostId: string
  name_label: string
  SR_type: string
  device_config: Record<string, string>
  name_description?: string
  content_type?: SrContentType
}

export function buildNewSrRestPayload(payload: NewSrPayload): NewSrRestPayload {
  const restPayload: NewSrRestPayload = {
    hostId: payload.hostId,
    name_label: payload.nameLabel,
    SR_type: payload.xapiType,
    device_config: payload.deviceConfig,
    content_type: payload.contentType,
  }

  if (payload.nameDescription !== undefined) {
    restPayload.name_description = payload.nameDescription
  }

  return restPayload
}

export const useXoSrCreateJob = defineJob('sr.create', [payloadArg], () => {
  const { t } = useI18n()

  return {
    async run(payload: NewSrRestPayload): Promise<FrontXoSr['id']> {
      const { id } = await fetchPost<{ id: FrontXoSr['id'] }>('srs', payload)
      return id
    },

    validate(isRunning, payload?: NewSrRestPayload) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (!payload) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (!payload.hostId) {
        throw new JobError(t('job:arg:host-required'))
      }

      if (!payload.name_label) {
        throw new JobError(t('job:arg:name-required'))
      }

      if (!payload.SR_type) {
        throw new JobError(t('job:arg:sr-type-required'))
      }
    },
  }
})
