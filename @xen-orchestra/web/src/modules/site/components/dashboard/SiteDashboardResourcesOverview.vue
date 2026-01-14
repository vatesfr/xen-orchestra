<template>
  <UiCard :has-error>
    <UiCardTitle>{{ t('resources-overview') }}</UiCardTitle>
    <VtsStateHero v-if="isLoading" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="isEmpty" format="card" type="no-data" size="extra-small" horizontal>
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
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
import { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { dashboard, hasError } = useXoSiteDashboard()

const { t } = useI18n()

const isLoading = computed(() => dashboard.value.resourcesOverview === undefined)

const isEmpty = computed(() => !isLoading.value && 'isEmpty' in dashboard.value.resourcesOverview!)

const ressources = computed(() => {
  if (isLoading.value || !('memorySize' in dashboard.value.resourcesOverview!)) {
    return
  }

  return dashboard.value.resourcesOverview
})

const nCpus = computed(() => ressources.value?.nCpus)

const memorySize = computed(() => formatSizeRaw(ressources.value?.memorySize, 1))

const srSize = computed(() => formatSizeRaw(ressources.value?.srSize, 1))
</script>

<style lang="postcss" scoped>
.line-1 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
</style>
