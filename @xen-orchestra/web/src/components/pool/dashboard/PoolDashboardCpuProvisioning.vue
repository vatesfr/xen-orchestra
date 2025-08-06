<template>
  <UiCard class="pool-dashboard-cpu-provisioning">
    <UiCardTitle>{{ t('cpu-provisioning') }}</UiCardTitle>
    <VtsLoadingHero v-if="!isCpuProvisioningReady" type="card" />
    <template v-else>
      <UiDataRuler :steps :accent :message="t('cpu-provisioning-warning')" />
      <UiProgressBar
        :thresholds="{ danger: 300, warning: 100 }"
        display-mode="percent"
        :legend="t('vcpus')"
        :value
        :max
      />
      <div class="total">
        <UiCardNumbers :label="t('vcpus-assigned')" :value="poolDashboard?.cpuProvisioning?.assigned" size="medium" />
        <UiCardNumbers :label="t('total-cpus')" :value="poolDashboard?.cpuProvisioning?.total" size="medium" />
      </div>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiDataRuler from '@core/components/ui/data-ruler/UiDataRuler.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { useProgress } from '@core/composables/progress-bar.composable.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
}>()

const { t } = useI18n()

const isCpuProvisioningReady = computed(() => poolDashboard?.cpuProvisioning !== undefined)

const { steps, value, max, percentage } = useProgress(
  () => poolDashboard?.cpuProvisioning?.assigned ?? 0,
  () => poolDashboard?.cpuProvisioning?.total
)

const accent = computed(() => (percentage.value > 300 ? 'danger' : 'warning'))
</script>

<style lang="postcss" scoped>
.pool-dashboard-cpu-provisioning {
  .total {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block-start: auto;
  }
}
</style>
