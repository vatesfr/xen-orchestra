import { xoaProxyPayloadArg } from '@/modules/appliance/jobs/xoa-proxy-args.ts'
import type { XoaProxyPayload } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { fetchPut } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useXoaProxySetJob = defineJob('xoa.set-proxy', [xoaProxyPayloadArg], () => {
  const { t } = useI18n()

  return {
    async run(payload: XoaProxyPayload) {
      await fetchPut('plugins/xoa/proxy', payload)
    },

    validate(isRunning, payload: XoaProxyPayload | undefined) {
      if (isRunning) {
        throw new JobRunningError(t('job:edit:in-progress'))
      }

      if (payload === undefined) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      if (payload.host === '') {
        throw new JobError(t('job:arg:host-required'))
      }
    },
  }
})
