<template>
  <UiCard class="pool-dashboard-cpu-provisioning">
    <UiCardTitle>{{ t('cpu-provisioning') }}</UiCardTitle>
    <VtsLoadingHero v-if="!isCpuProvisioningReady" type="card" />
    <template v-else>
      <VtsProgressBar
        :current="assignedCpus"
        :label="t('vcpus')"
        :thresholds="cpuProgressThresholds(t('cpu-provisioning-warning'))"
        :total="totalCpus"
        legend-type="percent"
      />
      <div class="total">
        <UiCardNumbers :label="t('vcpus-assigned')" :value="poolDashboard?.cpuProvisioning?.assigned" size="medium" />
        <UiCardNumbers :label="t('total-cpus')" :value="poolDashboard?.cpuProvisioning?.total" size="medium" />
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { cpuProgressThresholds } from '@core/utils/progress.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
}>()

const { t } = useI18n()

const isCpuProvisioningReady = computed(() => poolDashboard?.cpuProvisioning !== undefined)

const assignedCpus = computed(() => poolDashboard?.cpuProvisioning?.assigned ?? 0)

const totalCpus = computed(() => poolDashboard?.cpuProvisioning?.total ?? 0)
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
