<template>
  <div class="backup-repository">
    <CardTitle>
      {{ $t('backup-repository') }}
      <template #description>{{ $t('for-backup') }}</template>
    </CardTitle>
    <LoadingHero type="card" :disabled="isReady">
      <StackedBarWithLegend :max-value="backupRepositories.total?.value" :segments />
      <div class="numbers">
        <CardNumbers
          :value="backupRepositories.used?.value"
          :unit="backupRepositories.used?.prefix"
          :label="$t('used')"
          size="medium"
        />
        <CardNumbers
          :value="backupRepositories.available?.value"
          :unit="backupRepositories.available?.prefix"
          :label="$t('available')"
          size="medium"
        />
        <CardNumbers
          :value="backupRepositories.total?.value"
          :unit="backupRepositories.total?.prefix"
          :label="$t('total')"
          size="medium"
        />
      </div>
    </LoadingHero>
  </div>
</template>

<script setup lang="ts">
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import StackedBarWithLegend, {
  type StackedBarWithLegendProps,
} from '@core/components/stacked-bar-with-legend/StackedBarWithLegend.vue'
import LoadingHero from '@core/components/state-hero/LoadingHero.vue'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { backupRepositories, isReady } = useDashboardStore().subscribe()

const segments: ComputedRef<StackedBarWithLegendProps['segments']> = computed(() => [
  {
    label: t('backups'),
    value: backupRepositories.value.used?.value ?? 0,
    color: 'primary',
    unit: backupRepositories.value.used?.prefix,
  },
])
</script>

<style scoped lang="postcss">
.backup-repository {
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
