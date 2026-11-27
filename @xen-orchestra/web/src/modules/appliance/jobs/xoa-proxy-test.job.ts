import { xoaProxyPayloadArg } from '@/modules/appliance/jobs/xoa-proxy-args.ts'
import type { XoaProxyPayload } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type XoaProxyTestResult = {
  ok: boolean
  error?: string
}

export const useXoaProxyTestJob = defineJob('xoa.test-proxy', [xoaProxyPayloadArg], () => {
  const { t } = useI18n()

  return {
    run(payload: XoaProxyPayload) {
      return fetchPost<XoaProxyTestResult>('plugins/xoa/proxy/actions/test', payload)
    },

    validate(isRunning, payload: XoaProxyPayload | undefined) {
      if (isRunning) {
        throw new JobRunningError(t('job:xoa-test-proxy:in-progress'))
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
