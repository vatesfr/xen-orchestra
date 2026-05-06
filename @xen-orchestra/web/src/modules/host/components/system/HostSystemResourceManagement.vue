<template>
  <UiCard>
    <UiTitle>
      {{ t('resource-management') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('control-domain-memory')" :value="controllerMemory" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoVmControllerCollection } from '@/modules/vm/remote-resources/use-xo-vm-controller-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
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
