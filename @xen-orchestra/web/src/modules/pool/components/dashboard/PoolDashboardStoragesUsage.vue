<template>
  <UiCard :has-error class="pool-storages-usage">
    <UiCardTitle>
      {{ t('storage-usage') }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardTitle>
    <VtsStateHero v-if="!areStoragesUsageReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="topFiveUsage.length === 0" format="card" type="no-data" size="medium">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <template v-else>
      <VtsProgressBarGroup :items="progressBarItems" legend-type="percent" />
      <div class="total">
        <UiCardNumbers
          :label="t('total-used')"
          :unit="formattedTotalUsage.prefix"
          :value="formattedTotalUsage.value"
          size="medium"
        />
        <UiCardNumbers
          :label="t('total-free')"
          :unit="formattedTotalSizeFree.prefix"
          :value="formattedTotalSizeFree.value"
          size="medium"
        />
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/modules/pool/types/pool-dashboard.type'
import VtsProgressBarGroup, {
  type ProgressBarGroupItem,
} from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { useArrayReduce } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const areStoragesUsageReady = computed(() => poolDashboard?.srs?.topFiveUsage !== undefined)

const topFiveUsage = computed(() => poolDashboard?.srs?.topFiveUsage ?? [])

const totalUsage = useArrayReduce(topFiveUsage, (sum, sr) => sum + sr.physical_usage, 0)
const totalSize = useArrayReduce(topFiveUsage, (sum, sr) => sum + sr.size, 0)

const formattedTotalUsage = computed(() => formatSizeRaw(totalUsage.value, 0))
const formattedTotalSizeFree = computed(() => formatSizeRaw(totalSize.value - totalUsage.value, 0))

const progressBarItems = computed(() =>
  topFiveUsage.value.map(
    sr =>
      ({
        id: sr.id,
        label: sr.name_label,
        current: sr.percent,
        total: 100,
      }) satisfies ProgressBarGroupItem
  )
)
</script>

<style lang="postcss" scoped>
.pool-storages-usage {
  .total {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block-start: auto;
  }
}
</style>
