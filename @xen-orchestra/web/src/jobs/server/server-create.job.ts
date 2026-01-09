import { fetchPost } from '@/utils/fetch.util'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import type { XoServer } from '@vates/types'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'

type TCreateServerPayload = {
  host: string
  username: string
  password: string
  httpProxy?: string
  readOnly?: boolean
  allowUnauthorized?: boolean
  label?: string
}

const payloadsArg = defineJobArg<Ref<TCreateServerPayload>>({
  identify: payload => payload.value.host,
  toArray: true,
})

export const useServerCreateJob = defineJob('server.create', [payloadsArg], () => {
  const { t } = useI18n()

  return {
    run(payloads): Promise<PromiseSettledResult<XoServer['id']>[]> {
      return Promise.allSettled(
        payloads.map(async payload => {
          const { id } = await fetchPost<{ id: XoServer['id'] }>('servers', payload.value)
          return id
        })
      )
    },
    validate(isRunning, payloads) {
      if (isRunning) {
        throw new JobRunningError(t('job:server-create:in-progress'))
      }

      if (payloads.length === 0) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      payloads.forEach(payload => {
        const { value } = payload

        if (value.host === '') {
          throw new JobError(t('job:arg:host-required'))
        }

        if (value.username === '') {
          throw new JobError(t('job:arg:username-required'))
        }

        if (value.password === '') {
          throw new JobError(t('job:arg:password-required'))
        }
      })
    },
  }
})
