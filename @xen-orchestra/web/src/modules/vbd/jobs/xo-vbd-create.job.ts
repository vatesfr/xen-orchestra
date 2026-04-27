import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import type { XoVbd, XoVdi, XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type NewVbdPayload = {
  VM: XoVm['id']
  VDI: XoVdi['id']
  mode: 'RW' | 'RO'
}

const payloadsArg = defineJobArg<NewVbdPayload>({
  identify: payload => `${payload.VM}:${payload.VDI}`,
  toArray: true,
})

export const useXoVbdCreateJob = defineJob('vbd.create', [payloadsArg], () => {
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<XoVbd['id']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { id } = await fetchPost<{ id: XoVbd['id'] }>('vbds', payload)
          return id
        })
      )
    },

    validate(isRunning, payloads) {
      if (isRunning) {
        throw new JobRunningError(t('job:create:in-progress'))
      }

      if (payloads.length === 0) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})
