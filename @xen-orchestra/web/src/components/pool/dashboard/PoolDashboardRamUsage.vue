<template>
  <UiCard class="pool-dashboard-ram-usage">
    <UiCardTitle>
      {{ t('ram-usage') }}
    </UiCardTitle>
    <UiCardSubtitle>
      {{ t('host') }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardSubtitle>
    <UiDataRuler />
    <VtsLoadingHero v-if="!areHostsRamUsageReady" type="card" />
    <template v-else>
      <HostsRamUsage :hosts="poolDashboard?.hosts" />
    </template>
    <UiCardSubtitle>
      {{ t('vms', 2) }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardSubtitle>
    <UiDataRuler />
    <VtsLoadingHero v-if="!areVmsRamUsageReady" type="card" />
    <template v-else>
      <VmsRamUsage :vms="poolDashboard?.vms" />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardSubtitle from '@core/components/ui/card-subtitle/UiCardSubtitle.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiDataRuler from '@core/components/ui/data-ruler/UiDataRuler.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import HostsRamUsage from './ramUsage/HostsRamUsage.vue'
import VmsRamUsage from './ramUsage/VmsRamUsage.vue'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
}>()

const areHostsRamUsageReady = computed(() => poolDashboard?.hosts?.topFiveUsage?.ram !== undefined)
const areVmsRamUsageReady = computed(() => poolDashboard?.vms?.topFiveUsage?.ram !== undefined)

const { t } = useI18n()
</script>
