<template>
  <UiCard class="host-dashboard-ram-provisioning">
    <UiCardTitle>{{ t('ram-provisioning') }}</UiCardTitle>
    <VtsStateHero v-if="!isReady" format="card" busy size="medium" />
    <template v-else>
      <VtsProgressBar
        :current="memory?.usage ?? 0"
        :label="host.name_label"
        :total="memory?.size ?? 0"
        legend-type="percent"
      />
      <div class="total">
        <UiCardNumbers
          :label="t('total-assigned')"
          :unit="ramUsage.used.prefix"
          :value="ramUsage.used.value"
          size="medium"
        />
        <UiCardNumbers
          :label="t('total-free')"
          :unit="ramUsage.free.prefix"
          :value="ramUsage.free.value"
          size="medium"
        />
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { isReady: isHostReady } = useHostStore().subscribe()
const { getHostMemory, isReady: isHostMetricsReady } = useHostMetricsStore().subscribe()

const isReady = logicAnd(isHostReady, isHostMetricsReady)

const memory = computed(() => getHostMemory(host))

const ramUsage = computed(() => {
  const total = memory.value?.size ?? 0
  const used = memory.value?.usage ?? 0

  return {
    total: formatSizeRaw(total, 0),
    used: formatSizeRaw(used, 0),
    free: formatSizeRaw(total - used, 0),
  }
})
</script>

<style lang="postcss" scoped>
.host-dashboard-ram-provisioning {
  .total {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block-start: auto;
  }
}
</style>
