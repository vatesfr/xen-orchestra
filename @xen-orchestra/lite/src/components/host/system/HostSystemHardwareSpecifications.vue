<template>
  <UiCard>
    <UiTitle>
      {{ $t('hardware-specifications') }}
    </UiTitle>
    <VtsCardRowKeyValue>
      <template #key> {{ $t('manufacturer-info') }}</template>
      <template #value> {{ host.bios_strings['system-manufacturer'] }}</template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('bios-info') }}
      </template>
      <template #value>
        {{ host.bios_strings['bios-version'] }}
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('cpu-model') }}
      </template>
      <template #value>
        {{ host.cpu_info.modelname }}
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('core-socket') }}
      </template>
      <template #value>
        {{ coreSocketValue }}
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('hyper-threading') }}
      </template>
      <template #value>
        <span class="value" />
        <!--        Waiting for the API endpoint -->
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('gpus') }}
      </template>
      <template #value>
        <span class="value" />
        <!--        Waiting for the API endpoint -->
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('system-disks-health') }}
      </template>
      <template #value>
        <span class="value" />
        <!--        Waiting for the API endpoint -->
      </template>
    </VtsCardRowKeyValue>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XenApiHost
}>()
const coreSocketValue = computed(() => {
  return `${host.cpu_info.cpu_count} (${host.cpu_info.socket_count})`
})
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
