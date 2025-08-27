<template>
  <VtsStateHero v-if="topFiveRam === undefined" format="card" type="no-data" image-size="medium">
    {{ t('no-data-to-calculate') }}
  </VtsStateHero>
  <template v-else>
    <VtsProgressBarGroup :items="progressBarItems" legend-type="bytes-with-total" />
  </template>
</template>

<script lang="ts" setup>
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsProgressBarGroup, {
  type ProgressBarGroupItem,
} from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { topFiveRam = [] } = defineProps<{
  topFiveRam: NonNullable<NonNullable<XoPoolDashboard['hosts']>['topFiveUsage']>['ram'] | undefined
}>()

const { t } = useI18n()

const progressBarItems = computed(() =>
  topFiveRam.map(
    ram =>
      ({
        id: ram.id,
        label: ram.name_label,
        current: ram.usage,
        total: ram.size,
      }) satisfies ProgressBarGroupItem
  )
)
</script>
