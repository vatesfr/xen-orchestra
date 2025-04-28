<template>
  <UiCard>
    <UiTitle>
      {{ $t('resource-management') }}
    </UiTitle>
    <VtsCardRowKeyValue>
      <template #key> {{ $t('control-domain-memory') }}</template>
      <template #value>
        <span class="value"> {{ getControllerMemoryInGb }}</span>
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
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useControlDomainStore } from '@/stores/xen-api/control-domain.store.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { records } = useControlDomainStore().subscribe()
const controlDomain = computed(() => {
  return records.value.find(controlDomain => controlDomain.$ref === host.control_domain)
})

const getControllerMemoryInGb = computed(() => {
  if (controlDomain.value === undefined) {
    return
  }
  const value = controlDomain.value.memory_dynamic_max / 1024 ** 3
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
