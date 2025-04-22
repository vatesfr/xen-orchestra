<template>
  <UiCard>
    <UiTitle>
      {{ $t('software-tooling') }}
    </UiTitle>
    <VtsCardRowKeyValue>
      <template #key> {{ $t('version') }}</template>
      <template #value> {{ host.version }}</template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('build-number') }}
      </template>
      <template #value>
        {{ host.build }}
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('toolstack-uptime') }}
      </template>
      <template #value>
        <VtsRelativeTime :date="Number(host.otherConfig.agent_start_time) * 1000" />
      </template>
    </VtsCardRowKeyValue>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoHost } from '@/types/xo/host.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { host } = defineProps<{
  host: XoHost
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
