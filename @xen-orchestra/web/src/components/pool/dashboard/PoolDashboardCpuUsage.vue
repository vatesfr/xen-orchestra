<template>
  <UiCard class="pool-dashboard-cpu-usage">
    <UiCardTitle>
      {{ t('cpu-usage') }}
    </UiCardTitle>
    <UiCardSubtitle>
      {{ t('host') }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardSubtitle>
    <VtsLoadingHero v-if="!areHostsCpuUsageReady" type="card" />
    <template v-else>
      <HostsCpuUsage :hosts="poolDashboard?.hosts" />
    </template>
    <UiCardSubtitle>
      {{ t('vms', 2) }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardSubtitle>
    <VtsLoadingHero v-if="!areVmsCpuUsageReady" type="card" />
    <template v-else>
      <VmsCpuUsage :vms="poolDashboard?.vms" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import HostsCpuUsage from '@/components/pool/dashboard/cpu-usage/HostsCpuUsage.vue'
import VmsCpuUsage from '@/components/pool/dashboard/cpu-usage/VmsCpuUsage.vue'
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardSubtitle from '@core/components/ui/card-subtitle/UiCardSubtitle.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
}>()

const areHostsCpuUsageReady = computed(() => poolDashboard?.hosts?.topFiveUsage?.cpu !== undefined)
const areVmsCpuUsageReady = computed(() => poolDashboard?.vms?.topFiveUsage?.cpu !== undefined)

const { t } = useI18n()
</script>
