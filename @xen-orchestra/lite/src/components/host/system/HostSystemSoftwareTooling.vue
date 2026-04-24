<template>
  <UiCard>
    <UiTitle>
      {{ t('software-tooling') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('version')" :value="host.software_version.product_version" />
      <VtsTabularKeyValueRow :label="t('build-number')" :value="host.software_version.build_number" />
      <VtsTabularKeyValueRow :label="t('toolstack-uptime')">
        <template v-if="isRunning" #value>
          <VtsRelativeTime :date="Number(host.other_config.agent_start_time) * 1000" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { isHostRunning } = useHostMetricsStore().subscribe()

const isRunning = computed(() => isHostRunning(host))
</script>
