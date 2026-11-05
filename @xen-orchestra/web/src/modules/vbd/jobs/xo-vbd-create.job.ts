import { payloadsArg } from '@/modules/vbd/jobs/xo-vbd-create-args.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { VBD_MODE } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type NewVbdPayload = {
  VM: FrontXoVm['id']
  VDI: FrontXoVdi['id']
  mode: VBD_MODE
  bootable?: boolean
}

export const useXoVbdCreateJob = defineJob('vbd.create', [payloadsArg], () => {
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<FrontXoVbd['id']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { id } = await fetchPost<{ id: FrontXoVbd['id'] }>('vbds', payload)
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
