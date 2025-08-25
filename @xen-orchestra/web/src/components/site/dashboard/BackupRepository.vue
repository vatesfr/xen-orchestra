<template>
  <div class="backup-repository">
    <UiCardTitle>
      {{ t('backup-repository') }}
      <template #description>{{ t('for-backup') }}</template>
    </UiCardTitle>
    <!--    TODO change and add loading when we have isReady available -->
    <VtsNoDataHero v-if="!areBackupRepositoriesReady" type="card" />
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
import type { BackupRepositories } from '@/remote-resources/use-xo-site-dashboard.ts'
import VtsStackedBarWithLegend, {
  type StackedBarWithLegendProps,
} from '@core/components/stacked-bar-with-legend/VtsStackedBarWithLegend.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { repositories } = defineProps<{
  repositories: BackupRepositories | undefined
}>()

const { t } = useI18n()

const areBackupRepositoriesReady = computed(() => repositories !== undefined)

const segments: ComputedRef<StackedBarWithLegendProps['segments']> = computed(() => [
  {
    label: t('xo-backups'),
    value: repositories?.backups.value ?? 0,
    accent: 'info',
    unit: repositories?.backups.prefix,
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
