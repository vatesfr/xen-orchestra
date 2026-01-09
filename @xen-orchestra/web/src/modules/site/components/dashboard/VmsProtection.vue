<template>
  <UiCard>
    <UiCardTitle>
      {{ t('backups:vms-protection') }}
      <template #description>{{ t('in-last-three-runs') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="!areBackupsVmsProtectionReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="backups === undefined" format="card" type="no-data" size="medium" />
    <template v-else>
      <VtsDonutChartWithLegend icon="object:backup-job" :segments="vmsProtectionSegments" />
      <div>
        <UiButton
          class="protection-helper"
          accent="brand"
          left-icon="legacy:status:info"
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
import type { XoDashboard } from '@/types/xo/dashboard.type.ts'
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

const { backups } = defineProps<{
  backups: XoDashboard['backups'] | undefined
}>()

const openVmProtectedModal = useModal(() => ({
  component: import('@/components/modals/VmProtected.vue'),
}))

const areBackupsVmsProtectionReady = computed(() => backups?.vmsProtection !== undefined)

const { t } = useI18n()

const vmsProtectionSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('backups:vms-protection:protected'),
    value: backups?.vmsProtection.protected ?? 0,
    accent: 'success',
  },
  {
    label: t('backups:vms-protection:unprotected'),
    value: backups?.vmsProtection.unprotected ?? 0,
    accent: 'warning',
  },
  {
    label: t('backups:vms-protection:no-job'),
    value: backups?.vmsProtection.notInJob ?? 0,
    accent: 'muted',
  },
])
</script>
