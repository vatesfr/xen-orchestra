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
    <VtsStateHero v-if="!areHostsRamUsageReady" format="card" type="busy" size="medium" />
    <template v-else>
      <HostsRamUsage :top-five-ram="poolDashboard?.hosts?.topFiveUsage?.ram" :has-error />
    </template>
    <UiCardSubtitle>
      {{ t('vms', 2) }}
      <template #info>
        {{ t('top-#', 5) }}
      </template>
    </UiCardSubtitle>
    <VtsStateHero v-if="!areVmsRamUsageReady" format="card" type="busy" size="medium" />
    <template v-else>
      <VmsRamUsage :top-five-ram="poolDashboard?.vms?.topFiveUsage?.ram" :has-error />
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import HostsRamUsage from '@/components/pool/dashboard/ram-usage/HostsRamUsage.vue'
import VmsRamUsage from '@/components/pool/dashboard/ram-usage/VmsRamUsage.vue'
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

const areHostsRamUsageReady = computed(() => poolDashboard?.hosts?.topFiveUsage?.ram !== undefined)
const areVmsRamUsageReady = computed(() => poolDashboard?.vms?.topFiveUsage?.ram !== undefined)

const { t } = useI18n()
</script>
