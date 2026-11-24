import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { type PoolNewHostFormData, usePoolNewHostForm } from '@/modules/pool/form/use-pool-new-host-form.ts'
import { type PoolAddHostPayload, useXoPoolAddHostJob } from '@/modules/pool/jobs/xo-pool-add-host.job.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoServerConnectJob } from '@/modules/server/jobs/xo-server-connect.job.ts'
import { useXoServerCreateJob } from '@/modules/server/jobs/xo-server-create.job.ts'
import { useXoServerForgetJob } from '@/modules/server/jobs/xo-server-forget.job.ts'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { fetchGet } from '@/shared/utils/fetch.util.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoServer } from '@vates/types'
import { reactiveComputed } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export function usePoolNewHost(rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>) {
  const poolId = toComputed(rawPoolId)

  const { getPoolById } = useXoPoolCollection()

  const pool = computed(() => getPoolById(poolId.value))

  const {
    hostInputBindings,
    usernameInputBindings,
    passwordInputBindings,
    allowUnauthorizedCheckboxBindings,
    validateAndBuildPayload,
    reset,
  } = usePoolNewHostForm()

  const serverPayload = ref<PoolNewHostFormData>({ host: '', username: '', password: '', allowUnauthorized: false })
  const serverId = ref<XoServer['id']>('' as XoServer['id'])
  const addHostPayload = ref<PoolAddHostPayload>()

  const { run: createServer } = useXoServerCreateJob([serverPayload])
  const { run: connectServer } = useXoServerConnectJob([serverId])
  const { run: forgetServer } = useXoServerForgetJob([serverId])
  const {
    run: addHostToPool,
    isRunning: isAddingNewHost,
    canRun: canAddNewHost,
    errorMessage: addNewHostErrorMessage,
  } = useXoPoolAddHostJob(pool, addHostPayload)

  async function createHostServer(): Promise<XoServer['id']> {
    const [createResult] = await createServer()

    if (createResult.status === 'rejected') {
      throw createResult.reason
    }

    return createResult.value
  }

  async function connectHostServer(id: XoServer['id']): Promise<FrontXoHost['id']> {
    serverId.value = id

    const [connectResult] = await connectServer()

    if (connectResult.status === 'rejected') {
      throw connectResult.reason
    }

    const { master } = await fetchGet<FrontXoServer>(`servers/${id}`)

    if (master === undefined) {
      throw new Error(`No host found for server ${id}`)
    }

    return master
  }

  async function forgetHostServer(id: XoServer['id']) {
    serverId.value = id

    const [result] = await forgetServer()

    if (result.status === 'rejected') {
      console.error(`Failed to forget server ${id}`, result.reason)
    }
  }

  async function addHostServerToPool(payload: PoolNewHostFormData) {
    let createdServerId: XoServer['id'] | undefined

    try {
      serverPayload.value = payload
      createdServerId = await createHostServer()

      addHostPayload.value = { hostId: await connectHostServer(createdServerId) }

      await addHostToPool()
    } catch (error) {
      console.error('Failed to add the new host to the pool', error)
    }

    if (createdServerId !== undefined) {
      await forgetHostServer(createdServerId)
    }
  }

  const { open } = useOverlay({
    component: () => import('@/modules/pool/components/drawer/PoolNewHostDrawer.vue'),
    events: {
      onConfirm: async () => {
        const payload = await validateAndBuildPayload()

        if (payload === undefined) {
          return KEEP_OVERLAY_OPEN
        }

        void addHostServerToPool(payload)
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    hostInputBindings: hostInputBindings.value,
    usernameInputBindings: usernameInputBindings.value,
    passwordInputBindings: passwordInputBindings.value,
    allowUnauthorizedCheckboxBindings: allowUnauthorizedCheckboxBindings.value,
  }))

  function addNewHost() {
    reset()

    return open({ props })
  }

  return { addNewHost, isAddingNewHost, canAddNewHost, addNewHostErrorMessage }
}
