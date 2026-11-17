import {
  type NewPrivateNetworkPayload,
  useXoPrivateNetworkCreateJob,
} from '@/modules/network/jobs/xo-private-network-create.job.ts'
import {
  type FrontXoPlugin,
  useXoPluginCollection,
} from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { isPluginLoaded } from '@/modules/plugin/utils/xo-plugin.util.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export function useNewPrivateNetwork(rawPool: MaybeRefOrGetter<FrontXoPool>) {
  const pool = toComputed(rawPool)

  const payload = ref<NewPrivateNetworkPayload>()

  const { run, isRunning: isCreatingPrivateNetwork } = useXoPrivateNetworkCreateJob(payload)

  const { useGetPluginById, arePluginsReady } = useXoPluginCollection()

  const sdnController = useGetPluginById('sdn-controller' as FrontXoPlugin['id'])

  const canCreatePrivateNetwork = computed(() => {
    if (sdnController.value === undefined) {
      return false
    }

    return isPluginLoaded(sdnController.value)
  })

  const isSdnControllerMissing = computed(() => arePluginsReady.value && !canCreatePrivateNetwork.value)

  const { open } = useOverlay({
    component: () => import('@/modules/network/components/drawer/NewPrivateNetworkDrawer.vue'),
    events: {
      onConfirm: (newPayload: NewPrivateNetworkPayload) => {
        payload.value = newPayload

        run({
          detached: true,
          onSuccess: ([result]) => {
            if (result.status === 'rejected') {
              console.error('Failed to create private network', result.reason)
            }
          },
        })
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    poolId: pool.value.id,
  }))

  function openNewPrivateNetworkDrawer() {
    return open({ props })
  }

  return {
    openNewPrivateNetworkDrawer,
    isCreatingPrivateNetwork,
    canCreatePrivateNetwork,
    isSdnControllerMissing,
  }
}
