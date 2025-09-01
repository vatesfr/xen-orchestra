<template>
  <UiCard class="host-dashboard-ram-provisioning">
    <UiCardTitle>{{ t('ram-provisioning') }}</UiCardTitle>
    <VtsStateHero v-if="!areHostsReady" format="card" busy />
    <template v-else>
      <VtsProgressBar
        :label="host.name_label"
        :total="host.memory.size"
        :current="host.memory.usage"
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
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import type { XoHost } from '@/types/xo/host.type'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { areHostsReady } = useXoHostCollection()

const ramUsage = computed(() => {
  const total = host.memory.size
  const used = host.memory.usage

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
