import type { NewVifPayload } from '@/modules/vif/form/new/use-new-vif-form.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import type { XoVif } from '@vates/types'
import { useI18n } from 'vue-i18n'

const payloadArg = defineJobArg<NewVifPayload>({
  identify: payload => payload.vmId,
  toArray: true,
})

export const useXoVifCreateJob = defineJob('vif.create', [payloadArg], () => {
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<XoVif['id']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { id } = await fetchPost<{ id: XoVif['id'] }>('vifs', payload)
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
        if (payload.networkId === undefined) {
          throw new JobError(t('job:vif-create:missing-network'))
        }
      })
    },
  }
})
