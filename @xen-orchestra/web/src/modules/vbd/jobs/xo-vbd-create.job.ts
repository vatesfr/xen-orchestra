import { payloadsVbdArg } from '@/modules/vbd/jobs/xo-vbd-create-args.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoVbd, XoVdi, XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type NewVbdPayload = {
  VM: XoVm['id']
  VDI: XoVdi['id']
  mode: 'RW' | 'RO'
  bootable?: boolean
}

export const useXoVbdCreateJob = defineJob('vbd.create', [payloadsVbdArg], () => {
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

      payloads.forEach(payload => {
        if (payload.VDI === undefined) {
          throw new JobError(t('job:arg:vdi-id-required'))
        }

        if (payload.VM === undefined) {
          throw new JobError(t('job:arg:vm-id-required'))
        }
      })
    },
  }
})
