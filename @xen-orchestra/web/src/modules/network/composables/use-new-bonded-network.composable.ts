import {
  type NewBondedNetworkPayload,
  useXoBondedNetworkCreateJob,
} from '@/modules/network/jobs/xo-bonded-network-create.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useNewBondedNetwork(rawPool: MaybeRefOrGetter<FrontXoPool>) {
  const pool = toComputed(rawPool)

  const payload = ref<NewBondedNetworkPayload>()

  const { run, isRunning: isCreatingBondedNetwork } = useXoBondedNetworkCreateJob(payload)

  const { open } = useOverlay({
    component: () => import('@/modules/network/components/drawer/NewBondedNetworkDrawer.vue'),
    events: {
      onConfirm: (newPayload: NewBondedNetworkPayload) => {
        payload.value = newPayload

        run({ detached: true })
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    poolId: pool.value.id,
  }))

  function openNewBondedNetworkDrawer() {
    return open({ props })
  }

  return {
    openNewBondedNetworkDrawer,
    isCreatingBondedNetwork,
  }
}
