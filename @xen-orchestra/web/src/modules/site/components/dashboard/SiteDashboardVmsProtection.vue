<template>
  <UiCard :has-error="isError">
    <UiCardTitle>
      {{ t('backups:vms-protection') }}
      <template #description>{{ t('in-last-three-runs') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="isLoading" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="isError" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <template v-else>
      <VtsDonutChartWithLegend icon="object:backup-job" :segments="vmsProtectionSegments" class="chart" />
      <div>
        <UiButton
          accent="brand"
          left-icon="status:info-circle"
          size="small"
          variant="tertiary"
          @click="openVmProtectedModal()"
        >
          {{ t('what-does-protected-means?') }}
        </UiButton>
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { dashboard, hasError } = useXoSiteDashboard()

const { vms } = useXoVmCollection()

const { t } = useI18n()

const openVmProtectedModal = useModal(() => ({
  component: import('@/shared/components/modals/VmProtected.vue'),
}))

const dashboardBackups = computed(() => dashboard.value.backups)

const isLoading = computed(() => dashboardBackups.value === undefined)

const isError = computed(
  () => hasError.value || (dashboardBackups.value !== undefined && 'error' in dashboardBackups.value)
)

const vmsProtection = computed(() => {
  if (!dashboardBackups.value || !('vmsProtection' in dashboardBackups.value)) {
    return
  }

  return dashboardBackups.value?.vmsProtection
})

const vmsProtectionSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('backups:vms-protection:protected'),
    value: vmsProtection.value?.protected ?? 0,
    accent: 'success',
  },
  {
    label: t('backups:vms-protection:unprotected'),
    value: vmsProtection.value?.unprotected ?? 0,
    accent: 'warning',
  },
  {
    label: t('backups:vms-protection:no-job'),
    value: vmsProtection.value?.notInJob ?? vms.value.length,
    accent: 'muted',
  },
])
</script>

<style lang="postcss" scoped>
.chart {
  flex-grow: 1;
}
</style>
