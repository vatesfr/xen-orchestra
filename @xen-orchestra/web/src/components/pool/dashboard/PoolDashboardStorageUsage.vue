<template>
  <UiCard class="pool-storage-usage">
    <UiCardTitle>
      {{ t('storage-usage') }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardTitle>
    <UiDataRuler />
    <VtsLoadingHero v-if="!areStorageUsageReady" type="card" />
    <template v-else>
      <UiProgressBar
        v-for="sr in pool?.srs.topFiveUsage"
        :key="sr.id"
        class="progressBar"
        :value="sr.percent"
        :legend="sr.name_label"
        :accent="sr.physical_usage > sr.size ? 'danger' : 'success'"
      />
      <div class="total">
        <UiCardNumbers
          :label="t('total-used')"
          :value="formattedTotalUsage.value"
          :unit="formattedTotalUsage.prefix"
          size="medium"
        />
        <UiCardNumbers
          :label="t('total-free')"
          :value="formattedTotalSize.value"
          :unit="formattedTotalSize.prefix"
          size="medium"
        />
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiDataRuler from '@core/components/ui/data-ruler/UiDataRuler.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { useArrayReduce } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: XoPoolDashboard | undefined
}>()

const { t } = useI18n()

const areStorageUsageReady = computed(() => pool?.srs?.topFiveUsage !== undefined)

const topFiveUsage = computed(() => pool?.srs?.topFiveUsage ?? [])

const totalUsage = useArrayReduce(topFiveUsage, (sum, sr) => sum + sr.physical_usage, 0)
const totalSize = useArrayReduce(topFiveUsage, (sum, sr) => sum + sr.size, 0)

const formattedTotalUsage = computed(() => formatSizeRaw(totalUsage.value, 0))
const formattedTotalSize = computed(() => formatSizeRaw(totalSize.value, 0))
</script>

<style scoped lang="postcss">
.pool-storage-usage {
  .total {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block-start: auto;
  }
}
</style>
