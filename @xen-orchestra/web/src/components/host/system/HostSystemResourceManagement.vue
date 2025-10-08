<template>
  <UiCard>
    <UiTitle>
      {{ t('resource-management') }}
    </UiTitle>
    <UiLabelValue
      :label="t('control-domain-memory')"
      :value="`${controllerMemory?.value} ${controllerMemory?.prefix}`"
    />
  </UiCard>
</template>

<script setup lang="ts">
import { useXoVmControllerCollection } from '@/remote-resources/use-xo-vm-controller-collection.ts'
import type { XoHost } from '@/types/xo/host.type.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
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

  return formatSizeRaw(controllerDomain.memory.size, 2)
})
</script>
