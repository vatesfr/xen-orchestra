<template>
  <UiCard>
    <UiTitle>
      {{ t('resource-management') }}
    </UiTitle>
    <VtsQuickInfoRow
      :label="t('control-domain-memory')"
      :value="`${controllerMemory?.value} ${controllerMemory?.prefix}`"
    />
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
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { getByOpaqueRef } = useControlDomainStore().subscribe()

const controllerMemory = computed(() => {
  const controlDomain = getByOpaqueRef(host.control_domain)

  if (controlDomain === undefined) {
    return
  }

  return formatSizeRaw(controlDomain.memory_dynamic_max, 2)
})
</script>
