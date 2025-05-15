<template>
  <UiCard>
    <UiTitle>
      {{ $t('resource-management') }}
    </UiTitle>
    <VtsQuickInfoRow
      :label="$t('control-domain-memory')"
      :value="`${controllerMemory?.value} ${controllerMemory?.prefix}`"
    />
    <VtsQuickInfoRow :label="$t('schedule-granularity')">
      <!--        Waiting for the API endpoint -->
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import { useVmControllerStore } from '@/stores/xo-rest-api/vm-controller.store.ts'
import type { XoHost } from '@/types/xo/host.type.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XoHost
}>()

const { get: getController } = useVmControllerStore().subscribe()

const controllerMemory = computed(() => {
  if (host.controlDomain === undefined) {
    return
  }

  const controllerDomain = getController(host.controlDomain)

  if (controllerDomain === undefined) {
    return
  }

  return formatSizeRaw(controllerDomain.memory.size, 2)
})
</script>
