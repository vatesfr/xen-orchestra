<template>
  <UiCard>
    <UiTitle>
      {{ $t('software-tooling') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('version')" :value="host.software_version.product_version" />
    <VtsQuickInfoRow :label="$t('build-number')" :value="host.software_version.build_number" />
    <VtsQuickInfoRow :label="$t('toolstack-uptime')">
      <template v-if="isRunning" #value>
        <VtsRelativeTime :date="Number(host.other_config.agent_start_time) * 1000" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import VtsRelativeTime from '@/components/RelativeTime.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { isHostRunning } = useHostMetricsStore().subscribe()

const isRunning = computed(() => isHostRunning(host))
</script>
