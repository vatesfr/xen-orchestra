<template>
  <UiCard :has-error>
    <UiCardTitle>{{ t('resources-overview') }}</UiCardTitle>
    <VtsStateHero v-if="!areResourcesOverviewReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero
      v-else-if="memorySize?.value === 0 && nCpus === 0 && srSize?.value === 0"
      format="card"
      type="no-data"
      size="extra-small"
      horizontal
    >
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
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
import type { XoDashboard } from '@/types/xo/dashboard.type.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { resources } = defineProps<{
  resources: XoDashboard['resourcesOverview'] | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const areResourcesOverviewReady = computed(() => resources !== undefined)
const nCpus = computed(() => resources?.nCpus)
const memorySize = computed(() => formatSizeRaw(resources?.memorySize, 1))
const srSize = computed(() => formatSizeRaw(resources?.srSize, 1))
</script>

<style lang="postcss" scoped>
.line-1 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
</style>
