import {
  type NewInternalNetworkPayload,
  useXoInternalNetworkCreateJob,
} from '@/modules/network/jobs/xo-internal-network-create.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useNewInternalNetwork(rawPool: MaybeRefOrGetter<FrontXoPool>) {
  const pool = toComputed(rawPool)

  const payload = ref<NewInternalNetworkPayload>()

  const { run, isRunning: isCreatingInternalNetwork } = useXoInternalNetworkCreateJob(payload)

  const { open } = useOverlay({
    component: () => import('@/modules/network/components/drawer/NewInternalNetworkDrawer.vue'),
    events: {
      onConfirm: (newPayload: NewInternalNetworkPayload) => {
        payload.value = newPayload

        run({ detached: true })
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    poolId: pool.value.id,
  }))

  function openNewInternalNetworkDrawer() {
    return open({ props })
  }

  return {
    openNewInternalNetworkDrawer,
    isCreatingInternalNetwork,
  }
}
