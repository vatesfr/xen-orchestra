<template>
  <UiCard>
    <UiTitle>
      {{ $t('resource-management') }}
    </UiTitle>
    <VtsQuickInfoRow
      :label="$t('control-domain-memory')"
      :value="`${controllerMemory?.value} ${controllerMemory?.prefix}`"
    />
    <VtsQuickInfoRow disabled :label="$t('scheduler-granularity')" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useControlDomainStore } from '@/stores/xen-api/control-domain.store.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { getByOpaqueRef } = useControlDomainStore().subscribe()

const controlDomain = computed(() => getByOpaqueRef(host.control_domain))

const controllerMemory = computed(() => {
  if (controlDomain.value === undefined) {
    return
  }

  return formatSizeRaw(controlDomain.value.memory_dynamic_max, 2)
})
</script>
