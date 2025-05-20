<template>
  <UiCard>
    <UiCardTitle>{{ t('resources-overview') }}</UiCardTitle>
    <VtsLoadingHero v-if="!areResourcesOverviewReady" type="card" />
    <template v-else>
      <div class="line-1">
        <UiCardNumbers :label="t('total-memory')" :value="memorySize?.value" :unit="memorySize?.prefix" size="medium" />
        <UiCardNumbers :label="t('total-cpus')" :value="nCpus" size="medium" />
      </div>
      <UiCardNumbers
        :label="t('total-storage-repository')"
        :value="srSize?.value"
        :unit="srSize?.prefix"
        size="medium"
      />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { record } = useDashboardStore().subscribe()

const { t } = useI18n()

const areResourcesOverviewReady = computed(() => record.value?.resourcesOverview !== undefined)
const nCpus = computed(() => record.value?.resourcesOverview?.nCpus)
const memorySize = computed(() => formatSizeRaw(record.value?.resourcesOverview?.memorySize, 1))
const srSize = computed(() => formatSizeRaw(record.value?.resourcesOverview?.srSize, 1))
</script>

<style lang="postcss" scoped>
.line-1 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
</style>
