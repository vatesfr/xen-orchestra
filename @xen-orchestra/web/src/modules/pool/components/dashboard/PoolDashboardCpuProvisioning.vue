<template>
  <UiCard :has-error class="pool-dashboard-cpu-provisioning">
    <UiCardTitle>{{ t('cpu-provisioning') }}</UiCardTitle>
    <VtsStateHero v-if="!isCpuProvisioningReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="extra-small">
      {{ t('error-no-data') }}
    </VtsStateHero>
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
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { cpuProgressThresholds } from '@core/utils/progress.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
  hasError?: boolean
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
