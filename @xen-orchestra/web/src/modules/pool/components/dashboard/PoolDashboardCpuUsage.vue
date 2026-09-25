<template>
  <UiCard :has-error>
    <UiCardTitle>
      {{ t('cpu-usage') }}
    </UiCardTitle>
    <UiCardSubtitle>
      {{ t('host') }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardSubtitle>
    <VtsStatefulProgressBarGroup
      :items="hostsCpuItems ?? []"
      :thresholds="cpuThresholds"
      :has-error
      :busy="hostsCpuItems === undefined"
      legend-type="percent"
    />
    <UiCardSubtitle>
      {{ t('vms') }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardSubtitle>
    <VtsStatefulProgressBarGroup
      :items="vmsCpuItems ?? []"
      :thresholds="cpuThresholds"
      :has-error
      :busy="vmsCpuItems === undefined"
      legend-type="percent"
    />
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { toPercentProgressItem } from '@/modules/pool/utils/xo-pool-dashboard.util.ts'
import VtsStatefulProgressBarGroup from '@core/components/stateful-progress-bar-group/VtsStatefulProgressBarGroup.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardSubtitle from '@core/components/ui/card-subtitle/UiCardSubtitle.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { cpuProgressThresholds } from '@core/utils/progress.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
  hasError?: boolean
}>()

const cpuThresholds = cpuProgressThresholds()

const hostsCpuItems = computed(() => poolDashboard?.hosts?.topFiveUsage?.cpu?.map(toPercentProgressItem))

const vmsCpuItems = computed(() => poolDashboard?.vms?.topFiveUsage?.cpu?.map(toPercentProgressItem))

const { t } = useI18n()
</script>
