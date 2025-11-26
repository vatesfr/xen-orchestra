<template>
  <UiCard>
    <UiTitle>
      {{ t('resource-management') }}
    </UiTitle>
    <VtsQuickInfoRow :label="t('control-domain-memory')" :value="controllerMemory" />
  </UiCard>
</template>

<script setup lang="ts">
import { useXoVmControllerCollection } from '@/remote-resources/use-xo-vm-controller-collection.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import type { XoHost } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { getVmControllerById } = useXoVmControllerCollection()

const controllerMemory = computed(() => {
  if (host.controlDomain === undefined) {
    return
  }

  const controllerDomain = getVmControllerById(host.controlDomain)

  if (controllerDomain === undefined) {
    return
  }

  return formatSize(controllerDomain.memory.size, 2)
})
</script>
