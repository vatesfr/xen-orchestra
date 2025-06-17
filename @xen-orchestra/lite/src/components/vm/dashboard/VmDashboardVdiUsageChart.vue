<template>
  <UiCard>
    <UiCardTitle>
      {{ t('vdi-throughput') }}
      <template #description>{{ t('last-week') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="loading" type="card" />
    <VtsErrorNoDataHero v-else-if="error" type="card" />
    <VtsNoDataHero v-else-if="vdiUsage.length === 0" type="card" />
    <VtsLinearChart v-else :data="vdiUsage" :max-value :value-formatter="byteFormatter" />
  </UiCard>
</template>

<script lang="ts" setup>
import { RRD_STEP_FROM_STRING, type VmStats } from '@/libs/xapi-stats.ts'
import type { LinearChartData } from '@core/types/chart.ts'
import VtsErrorNoDataHero from '@core/components/state-hero/VtsErrorNoDataHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'

const { data } = defineProps<{
  data: {
    stats: VmStats | undefined
    timestampStart: number
  }
  loading: boolean
  error?: string
}>()

const VtsLinearChart = defineAsyncComponent(() => import('@core/components/linear-chart/VtsLinearChart.vue'))

const { t } = useI18n()

const vdiUsage = computed((): LinearChartData => {
  const { stats, timestampStart } = data

  const xvds = stats?.xvds

  if (!xvds) {
    return []
  }

  const addVdiData = (type: 'r' | 'w') => {
    const xvdsArrays = Object.values(xvds[type])

    if (xvdsArrays.length === 0) {
      return {
        label: '',
        data: [],
      }
    }

    const data = Array.from({ length: xvdsArrays[0].length }, (_, idx) => {
      const timestamp =
        (timestampStart - RRD_STEP_FROM_STRING.hours * (xvdsArrays[0].length - 1) + idx * RRD_STEP_FROM_STRING.hours) *
        1000

      const value = xvdsArrays.reduce((sum, arr) => sum + (arr[idx] ?? 0), 0)

      return {
        timestamp,
        // Sometimes we got infinity values in the result, we need to replace it with null
        value: Number.isFinite(value) ? value : null,
      }
    })

    return {
      label: type === 'r' ? t('read') : t('write'),
      data,
    }
  }

  return [addVdiData('r'), addVdiData('w')]
})

const maxValue = computed(() => {
  const values = vdiUsage.value.reduce(
    (acc, series) => [...acc, ...series.data.map(item => item.value ?? 0)],
    [] as number[]
  )

  if (values.length === 0) {
    return 100
  }

  const maxUsage = Math.max(...values) * 1.2

  return Math.ceil(maxUsage / 100) * 100
})

const byteFormatter = (value: number | null) => {
  if (value === null) {
    return ''
  }

  const result = formatSizeRaw(value, 1)

  return `${result?.value} ${result?.prefix}`
}
</script>
