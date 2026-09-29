<template>
  <UiCard :has-error>
    <UiCardTitle>
      {{ t('ram-usage') }}
    </UiCardTitle>
    <UiCardSubtitle>
      {{ t('host') }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardSubtitle>
    <VtsStatefulProgressBarGroup
      :items="hostsRamItems ?? []"
      :has-error
      :busy="hostsRamItems === undefined"
      legend-type="bytes-with-total"
    />
    <UiCardSubtitle>
      {{ t('vms') }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardSubtitle>
    <VtsStatefulProgressBarGroup
      :items="vmsRamItems ?? []"
      :has-error
      :busy="vmsRamItems === undefined"
      legend-type="bytes-with-total"
    />
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { toHostRamProgressItem, toVmRamProgressItem } from '@/modules/pool/utils/xo-pool-dashboard.util.ts'
import VtsStatefulProgressBarGroup from '@core/components/stateful-progress-bar-group/VtsStatefulProgressBarGroup.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardSubtitle from '@core/components/ui/card-subtitle/UiCardSubtitle.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
  hasError?: boolean
}>()

const hostsRamItems = computed(() => poolDashboard?.hosts?.topFiveUsage?.ram?.map(toHostRamProgressItem))

const vmsRamItems = computed(() => poolDashboard?.vms?.topFiveUsage?.ram?.map(toVmRamProgressItem))

const { t } = useI18n()
</script>
