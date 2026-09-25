<template>
  <UiCard :has-error class="pool-storages-usage">
    <UiCardTitle>
      {{ t('storage-usage') }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardTitle>
    <VtsStatefulProgressBarGroup
      :items="progressBarItems"
      :busy="!areStoragesUsageReady"
      :has-error
      legend-type="percent"
    >
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
    </VtsStatefulProgressBarGroup>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { getStoragesUsageTotals, toPercentProgressItem } from '@/modules/pool/utils/xo-pool-dashboard.util.ts'
import VtsStatefulProgressBarGroup from '@core/components/stateful-progress-bar-group/VtsStatefulProgressBarGroup.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const areStoragesUsageReady = computed(() => poolDashboard?.srs?.topFiveUsage !== undefined)

const topFiveUsage = computed(() => poolDashboard?.srs?.topFiveUsage ?? [])

const totals = computed(() => getStoragesUsageTotals(topFiveUsage.value))

const formattedTotalUsage = computed(() => formatSizeRaw(totals.value.totalUsage, 0))
const formattedTotalSizeFree = computed(() => formatSizeRaw(totals.value.totalSize - totals.value.totalUsage, 0))

const progressBarItems = computed(() => topFiveUsage.value.map(toPercentProgressItem))
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
