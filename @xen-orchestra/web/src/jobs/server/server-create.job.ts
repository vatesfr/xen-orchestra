import { fetchPost } from '@/utils/fetch.util'
import { defineJob, defineJobArg, JobError, JobRunningError } from '@core/packages/job'
import type { XoServer } from '@vates/types'
import type { Ref } from 'vue'

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

export const useJobServerCreate = defineJob('server.create', [payloadsArg], () => {
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
        throw new JobRunningError('create server already running')
      }
      if (payloads.length === 0) {
        throw new JobError('payload is missing')
      }

      payloads.forEach(payload => {
        if (payload.value.host === '') {
          throw new JobError('Host is requred')
        }
        if (payload.value.username === '') {
          throw new JobError('Username is required')
        }
        if (payload.value.password === '') {
          throw new JobError('Password is required')
        }
      })
    },
  }
})
