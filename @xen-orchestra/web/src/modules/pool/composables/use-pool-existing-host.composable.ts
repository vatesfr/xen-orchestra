import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { type PoolAddHostPayload, useXoPoolAddHostJob } from '@/modules/pool/jobs/xo-pool-add-host.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoServerForgetJob } from '@/modules/server/jobs/xo-server-forget.job.ts'
import { useXoServerCollection } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoServer } from '@vates/types'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function usePoolExistingHost(rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>) {
  const poolId = toComputed(rawPoolId)

  const { getHostById } = useXoHostCollection()
  const { serverByPool } = useXoServerCollection()

  const serverId = ref<XoServer['id']>('' as XoServer['id'])
  const addHostPayload = ref<PoolAddHostPayload>()

  const { run: forgetServer } = useXoServerForgetJob([serverId])
  const {
    run: addHostToPool,
    isRunning: isAddingExistingHost,
    canRun: canAddExistingHost,
    errorMessage: addExistingHostErrorMessage,
  } = useXoPoolAddHostJob(poolId, addHostPayload)

  const { open } = useOverlay({
    component: () => import('@/modules/pool/components/drawer/PoolExistingHostDrawer.vue'),
    events: {
      onConfirm: (hostId: FrontXoHost['id'] | undefined) => {
        if (hostId === undefined) {
          return KEEP_OVERLAY_OPEN
        }

        const hostPoolId = getHostById(hostId)?.$pool
        const sourceServerId = hostPoolId !== undefined ? serverByPool.value.get(hostPoolId)?.[0]?.id : undefined

        addHostPayload.value = { hostId }

        addHostToPool({
          detached: true,
          onSuccess: async () => {
            if (sourceServerId === undefined) {
              console.error(`No server found for host ${hostId}`)
              return
            }

            serverId.value = sourceServerId

            const [forgetResult] = await forgetServer()

            if (forgetResult.status === 'rejected') {
              console.error(`Failed to forget server ${sourceServerId}`, forgetResult.reason)
            }
          },
        })
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    poolId: poolId.value,
  }))

  function addExistingHost() {
    return open({ props })
  }

  return { addExistingHost, isAddingExistingHost, canAddExistingHost, addExistingHostErrorMessage }
}
