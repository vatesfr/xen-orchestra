import { type NewNetworkPayload, useXoNetworkCreateJob } from '@/modules/network/jobs/xo-network-create.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function useNewNetwork(rawPool: MaybeRefOrGetter<FrontXoPool>) {
  const pool = toComputed(rawPool)

  const payload = ref<NewNetworkPayload>()

  const { run, isRunning: isCreatingNetwork } = useXoNetworkCreateJob(payload)

  const { open } = useOverlay({
    component: () => import('@/modules/network/components/drawer/NewNetworkDrawer.vue'),
    events: {
      onConfirm: (newPayload: NewNetworkPayload) => {
        payload.value = newPayload

        run({ detached: true })
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    poolId: pool.value.id,
  }))

  function openNewNetworkDrawer() {
    return open({ props })
  }

  return {
    openNewNetworkDrawer,
    isCreatingNetwork,
  }
}
