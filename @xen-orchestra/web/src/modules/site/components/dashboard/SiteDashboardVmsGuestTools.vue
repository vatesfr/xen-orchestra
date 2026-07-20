<template>
  <UiCard>
    <UiCardTitle>
      {{ t('vms-guest-tools') }}
      <template #info>
        <UiLink size="small" :to="{ name: '/(site)/vms' }">{{ t('action:see-all') }}</UiLink>
      </template>
    </UiCardTitle>
    <VtsStateHero v-if="!areVmsReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="vmGuestToolsStatus.total === 0" format="card" type="no-data" size="extra-small" horizontal>
      {{ t('no-running-vm-detected') }}
    </VtsStateHero>
    <template v-else>
      <VtsDonutChartWithLegend :segments class="chart" />
      <UiCardNumbers :label="t('total')" :value="vmGuestToolsStatus.total" size="small" />
      <UiButton
        v-if="
          vmGuestToolsStatus.outOfDateVms.length > 0 ||
          vmGuestToolsStatus.missingVms.length > 0 ||
          vmGuestToolsStatus.unknownVms.length > 0
        "
        accent="brand"
        left-icon="status:info-circle"
        size="small"
        variant="tertiary"
        class="details-button"
        @click="openDetailsModal()"
      >
        {{ t('action:see-details') }}
      </UiButton>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useModal } from '@core/packages/modal/use-modal'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmGuestToolsStatus, areVmsReady } = useXoVmCollection()

const openDetailsModal = useModal(() => ({
  component: import('./SiteDashboardVmsGuestToolsModal.vue'),
}))

const { t } = useI18n()

const outOfDateTooltip = computed(() => {
  const versions = vmGuestToolsStatus.value.outOfDateVersions
  if (versions.size === 0) {
    return undefined
  }

  return [...versions.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([version, count]) => `${version} (${count})`)
    .join(', ')
})

const segments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('up-to-date'),
    value: vmGuestToolsStatus.value.upToDate,
    accent: 'success',
  },
  {
    label: t('out-of-date'),
    value: vmGuestToolsStatus.value.outOfDateVms.length,
    accent: 'warning',
    tooltip: outOfDateTooltip.value,
  },
  {
    label: t('missing-guest-tools'),
    value: vmGuestToolsStatus.value.missingVms.length,
    accent: 'danger',
  },
  {
    label: t('unknown'),
    value: vmGuestToolsStatus.value.unknownVms.length,
    accent: 'neutral',
  },
])
</script>

<style lang="postcss" scoped>
.chart {
  flex-grow: 1;
}

.details-button {
  align-self: flex-start;
}
</style>
