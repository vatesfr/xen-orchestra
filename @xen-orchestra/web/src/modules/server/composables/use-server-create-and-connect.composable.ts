import { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
import { type TCreateServerPayload, useXoServerCreateJob } from '@/modules/server/jobs/xo-server-create.job.ts'
import { useXoServerForgetJob } from '@/modules/server/jobs/xo-server-forget.job.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoServer } from '@vates/types'
import { logicOr } from '@vueuse/math'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useServerCreateAndConnect(rawPayload: MaybeRefOrGetter<TCreateServerPayload>) {
  const payload = toComputed(rawPayload)

  const serverId = ref<XoServer['id']>('' as XoServer['id'])

  // TODO: multiple server creation not possible in the UI for now
  // so only handle a single payload
  const { run: create, isRunning: isCreating } = useXoServerCreateJob([payload])
  const { run: connect, isRunning: isConnecting } = useXoServerConnectJob([serverId])
  const { run: forget, isRunning: isForgetting } = useXoServerForgetJob([serverId])

  const isRunning = logicOr(isCreating, isConnecting, isForgetting)

  async function forgetServer(id: XoServer['id']) {
    serverId.value = id

    const [result] = await forget()

    if (result.status === 'rejected') {
      console.error(`Failed to forget server ${id}`, result.reason)
    }
  }

  async function createAndConnectServer(): Promise<XoServer['id']> {
    const [createResult] = await create()

    if (createResult.status === 'rejected') {
      throw createResult.reason
    }

    const id = createResult.value

    serverId.value = id

    const [connectResult] = await connect()

    if (connectResult.status === 'rejected') {
      await forgetServer(id)

      throw connectResult.reason
    }

    return id
  }

  return { createAndConnectServer, forgetServer, isRunning }
}
