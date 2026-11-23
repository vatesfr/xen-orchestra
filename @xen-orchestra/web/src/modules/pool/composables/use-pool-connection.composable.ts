import type { PoolConnectionPayload } from '@/modules/pool/form/use-pool-connection-form.ts'
import { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
import { useXoServerCreateJob } from '@/modules/server/jobs/xo-server-create.job.ts'
import { useXoServerForgetJob } from '@/modules/server/jobs/xo-server-forget.job.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import type { XoServer } from '@vates/types'
import { logicOr } from '@vueuse/math'
import { ref } from 'vue'

export function usePoolConnection() {
  const payload = ref<PoolConnectionPayload>({
    host: '',
    username: '',
    password: '',
    readOnly: false,
    allowUnauthorized: false,
  })

  const serverId = ref('' as XoServer['id'])

  // TODO: multiple server creation not possible in the UI for now
  // so only handle a single payload
  const { run: create, isRunning: isCreatingServer } = useXoServerCreateJob([payload])
  const { run: connect, isRunning: isConnectingServer } = useXoServerConnectJob([serverId])
  const { run: forget, isRunning: isForgettingServer } = useXoServerForgetJob([serverId])

  const isConnectingPool = logicOr(isCreatingServer, isConnectingServer, isForgettingServer)

  async function connectPool() {
    serverId.value = '' as XoServer['id']

    try {
      const [promiseCreateResult] = await create()

      if (promiseCreateResult.status === 'rejected') {
        throw promiseCreateResult.reason
      }

      serverId.value = promiseCreateResult.value

      const [promiseConnectResult] = await connect()

      if (promiseConnectResult.status === 'rejected') {
        throw promiseConnectResult.reason
      }
    } catch (error) {
      console.error(`Failed to connect the pool ${payload.value.host}`, error)

      if (serverId.value === '') {
        return
      }

      try {
        const [promiseForgetResult] = await forget()

        if (promiseForgetResult.status === 'rejected') {
          throw promiseForgetResult.reason
        }
      } catch (forgetError) {
        console.error(`Failed to forget the server ${serverId.value}`, forgetError)
      }
    }
  }

  const { open: openPoolConnectionDrawer } = useOverlay({
    component: () => import('@/modules/pool/components/drawer/PoolConnectionDrawer.vue'),
    events: {
      onConfirm: (newPayload: PoolConnectionPayload) => {
        payload.value = newPayload

        void connectPool()
      },
      onCancel: true,
    },
  })

  return {
    openPoolConnectionDrawer,
    isConnectingPool,
  }
}
