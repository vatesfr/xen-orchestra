<template>
  <UiCard :color="hasError ? 'error' : undefined">
    <UiCardTitle :left="t('storage-usage')" :right="t('top-#', { n: N_ITEMS })" />
    <NoDataError v-if="hasError" />
    <UiCardSpinner v-else-if="!isReady" />
    <UsageBar v-else :data="data.result" :n-items="N_ITEMS">
      <template #footer>
        <SizeStatsSummary :size="data.maxSize" :usage="data.usedSize" />
      </template>
    </UsageBar>
  </UiCard>
</template>

<script lang="ts" setup>
import NoDataError from '@/components/NoDataError.vue'
import SizeStatsSummary from '@/components/ui/SizeStatsSummary.vue'
import UiCard from '@/components/ui/UiCard.vue'
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import UiCardTitle from '@/components/ui/UiCardTitle.vue'
import UsageBar from '@/components/UsageBar.vue'
import { useSrStore } from '@/stores/xen-api/sr.store'
import { N_ITEMS } from '@/views/pool/PoolDashboardView.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { records: srs, isReady, hasError } = useSrStore().subscribe()

const data = computed<{
  result: { id: string; label: string; value: number }[]
  maxSize: number
  usedSize: number
}>(() => {
  const result: { id: string; label: string; value: number }[] = []
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

    result.push({
      id: uuid,
      label: name_label,
      value: percent,
    })
  })
  return { result, maxSize, usedSize }
})
</script>
