import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import {
  type TrafficRulePayload,
  useXoTrafficRuleCreateJob,
} from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { reactiveComputed } from '@vueuse/core'
import { type MaybeRefOrGetter, ref, toValue } from 'vue'

export function useNewTrafficRule(
  rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>,
  rawVifId?: MaybeRefOrGetter<FrontXoVif['id'] | undefined>
) {
  const payload = ref<TrafficRulePayload>()

  const { run, isRunning: isCreatingTrafficRule } = useXoTrafficRuleCreateJob(payload)

  const { open } = useOverlay({
    component: () => import('@/modules/traffic-rules/components/drawer/NewTrafficRuleDrawer.vue'),
    events: {
      onConfirm: (newPayload: TrafficRulePayload) => {
        payload.value = newPayload

        run({ detached: true })
      },
      onCancel: true,
    },
  })

  const props = reactiveComputed(() => ({
    poolId: toValue(rawPoolId),
    vifId: toValue(rawVifId),
  }))

  function openNewTrafficRuleDrawer() {
    return open({ props })
  }

  return {
    openNewTrafficRuleDrawer,
    isCreatingTrafficRule,
  }
}
