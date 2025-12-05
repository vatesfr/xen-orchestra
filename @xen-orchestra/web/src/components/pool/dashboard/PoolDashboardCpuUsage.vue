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
    <VtsStateHero v-if="!areHostsCpuUsageReady" format="card" type="busy" size="medium" />
    <template v-else>
      <HostsCpuUsage :top-five-cpu="poolDashboard?.hosts?.topFiveUsage?.cpu" :has-error />
    </template>
    <UiCardSubtitle>
      {{ t('vms') }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardSubtitle>
    <VtsStateHero v-if="!areVmsCpuUsageReady" format="card" type="busy" size="medium" />
    <template v-else>
      <VmsCpuUsage :top-five-cpu="poolDashboard?.vms?.topFiveUsage?.cpu" :has-error />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import HostsCpuUsage from '@/components/pool/dashboard/cpu-usage/HostsCpuUsage.vue'
import VmsCpuUsage from '@/components/pool/dashboard/cpu-usage/VmsCpuUsage.vue'
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardSubtitle from '@core/components/ui/card-subtitle/UiCardSubtitle.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
  hasError?: boolean
}>()

const areHostsCpuUsageReady = computed(() => poolDashboard?.hosts?.topFiveUsage?.cpu !== undefined)

const areVmsCpuUsageReady = computed(() => poolDashboard?.vms?.topFiveUsage?.cpu !== undefined)

const { t } = useI18n()
</script>
