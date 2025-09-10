<template>
  <UiCard>
    <UiCardTitle>{{ t('backups.vms-protection') }}</UiCardTitle>
    <VtsLoadingHero v-if="!areBackupsVmsProtectionReady" type="card" />
    <VtsNoDataHero v-else-if="backups === undefined" type="card" />
    <template v-else>
      <VtsDonutChartWithLegend :segments="vmsProtectionSegments" />
      <div>
        <!--        TODO add a link to a modal when component is available -->
        <UiLink size="small" icon="fa:info-circle">{{ t('what-does-protect-means') }}</UiLink>
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoDashboard } from '@/types/xo/dashboard.type.ts'
import VtsDonutChartWithLegend, {
  type DonutChartWithLegendProps,
} from '@core/components/donut-chart-with-legend/VtsDonutChartWithLegend.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backups } = defineProps<{
  backups: XoDashboard['backups'] | undefined
}>()

const areBackupsVmsProtectionReady = computed(() => backups?.vmsProtection !== undefined)

const { t } = useI18n()

const vmsProtectionSegments = computed<DonutChartWithLegendProps['segments']>(() => [
  {
    label: t('backups.vms-protection.protected'),
    value: backups?.vmsProtection.protected ?? 0,
    accent: 'success',
  },
  {
    label: t('backups.vms-protection.unprotected'),
    value: backups?.vmsProtection.unprotected ?? 0,
    accent: 'warning',
  },
  {
    label: t('backups.vms-protection.no-job'),
    value: backups?.vmsProtection.notInJob ?? 0,
    accent: 'muted',
  },
])
</script>
