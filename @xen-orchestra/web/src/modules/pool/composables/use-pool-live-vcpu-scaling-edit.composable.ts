import { useXoPoolEditLiveVcpuScalingJob } from '@/modules/pool/jobs/xo-pool-edit-live-vcpu-scaling.job.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref } from 'vue'

export function usePoolLiveVcpuScalingEdit(
  rawPool: MaybeRefOrGetter<FrontXoPool>,
  rawCap: MaybeRefOrGetter<number | undefined>
) {
  const pool = toComputed(rawPool)
  const cap = toComputed(rawCap)

  const newValue = ref<number | null | undefined>(undefined)

  const { run, canRun, isRunning, errorMessage } = useXoPoolEditLiveVcpuScalingJob(() => pool.value, newValue)

  const { open } = useOverlay({
    component: () => import('@/modules/pool/components/drawer/PoolLiveVcpuScalingDrawer.vue'),
    events: {
      onConfirm: (value: number | null) => {
        newValue.value = value
        run({ detached: true })
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    current: pool.value.vcpusMaxHeadroom,
    cap: cap.value,
  }))

  return {
    editLiveVcpuScaling: () => open({ props }),
    canEditLiveVcpuScaling: canRun,
    isEditingLiveVcpuScaling: isRunning,
    editLiveVcpuScalingErrorMessage: errorMessage,
  }
}
