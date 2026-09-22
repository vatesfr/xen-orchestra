import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { payloadArg } from '@/modules/storage-repository/jobs/xo-sr-create-args.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { SupportedSrType } from '@/modules/storage-repository/types/xo-sr-create.type.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type NewSrRestPayload = {
  hostId: FrontXoHost['id']
  name_label: string
  SR_type: SupportedSrType
  device_config: Record<string, string>
  name_description?: string
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
