<template>
  <div class="storage-repository">
    <UiCardTitle>
      {{ t('storage-repository') }}
      <template #description>{{ t('for-replication') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="!areStorageRepositoriesReady" format="card" busy />
    <template v-else>
      <VtsStackedBarWithLegend :max-value="maxValue" :segments />
      <div class="numbers">
        <UiCardNumbers
          :value="repositories?.used?.value"
          :unit="repositories?.used?.prefix"
          :label="t('used')"
          size="medium"
        />
        <UiCardNumbers
          :value="repositories?.available?.value"
          :unit="repositories?.available?.prefix"
          :label="t('available')"
          size="medium"
        />
        <UiCardNumbers
          :value="repositories?.total?.value"
          :unit="repositories?.total?.prefix"
          :label="t('total')"
          size="medium"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { StorageRepositories } from '@/remote-resources/use-xo-site-dashboard.ts'
import VtsStackedBarWithLegend, {
  type StackedBarWithLegendProps,
} from '@core/components/stacked-bar-with-legend/VtsStackedBarWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { repositories } = defineProps<{
  repositories: StorageRepositories | undefined
}>()

const { t } = useI18n()

const areStorageRepositoriesReady = computed(() => repositories !== undefined)

const segments: ComputedRef<StackedBarWithLegendProps['segments']> = computed(() => [
  {
    label: t('xo-replications'),
    value: repositories?.replicated?.value ?? 0,
    accent: 'info',
    unit: repositories?.replicated?.prefix,
  },
  {
    label: t('other'),
    value: repositories?.other?.value ?? 0,
    accent: 'warning',
    unit: repositories?.other?.prefix,
  },
])

const maxValue = computed(() => ({
  value: repositories?.total?.value,
  unit: repositories?.total?.prefix,
}))
</script>

<style scoped lang="postcss">
.storage-repository {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  flex: 1;
}

.numbers {
  display: flex;
  justify-content: space-between;
}
</style>
