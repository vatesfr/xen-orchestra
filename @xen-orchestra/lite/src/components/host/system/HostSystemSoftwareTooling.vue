<template>
  <UiCard>
    <UiTitle>
      {{ $t('software-tooling') }}
    </UiTitle>
    <VtsCardRowKeyValue>
      <template #key> {{ $t('version') }}</template>
      <template #value> {{ host.software_version?.product_version }}</template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('build-number') }}
      </template>
      <template #value>
        <span class="value">{{ host.software_version.build_number }}</span>
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('toolstack-uptime') }}
      </template>
      <template #value>
        <VtsRelativeTime :date="Number(host.other_config.agent_start_time) * 1000" />
      </template>
    </VtsCardRowKeyValue>
  </UiCard>
</template>

<script setup lang="ts">
import VtsRelativeTime from '@/components/RelativeTime.vue'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { host } = defineProps<{
  host: XenApiHost
}>()
</script>

<style lang="postcss" scoped>
:deep(.key),
:deep(.value) {
  width: auto !important;
  min-width: unset !important;
}

:deep(.vts-card-row-key-value) {
  gap: 2.4rem !important;
}

.value:empty::before {
  content: '-';
}
</style>
