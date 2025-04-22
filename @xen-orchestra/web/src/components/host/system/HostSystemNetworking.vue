<template>
  <UiCard>
    <UiTitle>
      {{ $t('networking') }}
    </UiTitle>
    <VtsCardRowKeyValue>
      <template #key> {{ $t('ip-address') }}</template>
      <template #value> {{ host.address }}</template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('remote-syslog') }}
      </template>
      <template #value>
        <span class="value"> {{ host.logging.syslog_destination }}</span>
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('iscsi-iqn') }}
      </template>
      <template #value>
        {{ host.iscsiIqn }}
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('multi-pathing') }}
      </template>
      <template #value>
        <VtsStatusMode :status="host.multipathing" />
      </template>
    </VtsCardRowKeyValue>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoHost } from '@/types/xo/host.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsStatusMode from '@core/components/status-mode/VtsStatusMode.vue'
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
