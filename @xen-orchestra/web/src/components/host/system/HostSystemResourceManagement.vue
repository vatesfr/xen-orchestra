<template>
  <UiCard>
    <UiTitle>
      {{ $t('resource-management') }}
    </UiTitle>
    <VtsCardRowKeyValue>
      <template #key> {{ $t('control-domain-memory') }}</template>
      <template #value>
        {{ getControllerMemoryInGb }}
      </template>
    </VtsCardRowKeyValue>
    <VtsCardRowKeyValue>
      <template #key>
        {{ $t('schedule-granularity') }}
      </template>
      <template #value>
        <!--        Waiting for the API endpoint -->
        <span class="value" />
      </template>
    </VtsCardRowKeyValue>
  </UiCard>
</template>

<script setup lang="ts">
import { useVmControllerStore } from '@/stores/xo-rest-api/vm-controller.store.ts'
import type { XoHost } from '@/types/xo/host.type.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XoHost
}>()

const { get: getController } = useVmControllerStore().subscribe()

const getControllerMemoryInGb = computed(() => {
  const controllerDomain = getController(host.controlDomain)
  if (controllerDomain === undefined) {
    return
  }
  const value = controllerDomain.memory.size / 1024 ** 3
  return `${Number.isInteger(value) ? value : value.toFixed(1)} GB`
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
