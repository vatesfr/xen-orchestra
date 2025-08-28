<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiCardTitle :left="t('storage-usage')" :right="t('top-#', { n: N_ITEMS })" />
    <VtsStateHero v-if="hasError" format="card" type="error" image-size="medium">
      {{ t('error-no-data') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="!isReady" format="card" busy />
    <template v-else>
      <VtsProgressBarGroup :items="data.progressBarItems" :n-items="N_ITEMS" legend-type="percent" />
      <div>
        <UiCardNumbers
          :label="t('total-used')"
          :unit="data.usedSize.prefix"
          :value="data.usedSize.value"
          size="medium"
        />
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import UiCard from '@/components/ui/UiCard.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import { N_ITEMS } from '@/pages/pool/[uuid]/dashboard.vue'
import { useSrStore } from '@/stores/xen-api/sr.store'
import VtsProgressBarGroup, {
  type ProgressBarGroupItem,
} from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { records: srs, isReady, hasError } = useSrStore().subscribe()

const data = computed(() => {
  const progressBarItems: ProgressBarGroupItem[] = []
  let maxSize = 0
  let usedSize = 0

  srs.value.forEach(({ name_label, physical_size, physical_utilisation, uuid, sm_config }) => {
    if (physical_size < 0 || physical_utilisation < 0 || sm_config.type === 'cd') {
      return
    }

    maxSize += physical_size
    usedSize += physical_utilisation

    const percent = (physical_utilisation / physical_size) * 100

    if (isNaN(percent)) {
      return
    }

    progressBarItems.push({
      id: uuid,
      label: name_label,
      current: percent,
      total: 100,
    })
  })

  return {
    progressBarItems,
    maxSize: formatSizeRaw(maxSize, 0),
    usedSize: formatSizeRaw(usedSize, 0),
  }
})
</script>
