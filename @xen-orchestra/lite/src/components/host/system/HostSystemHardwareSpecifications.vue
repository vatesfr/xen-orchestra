<template>
  <UiCard>
    <UiTitle>
      {{ t('hardware-specifications') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('manufacturer-info')" :value="manufacturerInfo" />
      <VtsTabularKeyValueRow
        :label="t('bios-info')"
        :value="`${host.bios_strings['bios-vendor']} (${host.bios_strings['bios-version']})`"
      />
      <VtsTabularKeyValueRow :label="t('cpu-model')" :value="host.cpu_info.modelname" />
      <VtsTabularKeyValueRow :label="t('core-socket')" :value="coreSocketInfo" />
      <VtsTabularKeyValueRow :label="t('gpus')">
        <template v-if="isReady" #value>
          <template v-if="devicesNames">
            {{ devicesNames }}
          </template>
          <template v-else>
            {{ t('none') }}
          </template>
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { getHostCoreSocketInfo, getHostManufacturerInfo } from '@/modules/host/utils/host.util.ts'
import { usePciStore } from '@/stores/xen-api/pci.store.ts'
import { usePgpuStore } from '@/stores/xen-api/pgpu.store.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { logicAnd } from '@vueuse/math'
import { useArrayReduce } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { pGpusByHost, isReady: isPgpuReady } = usePgpuStore().subscribe()
const { getByOpaqueRef: getPciByOpaqueRef, isReady: isPciReady } = usePciStore().subscribe()

const isReady = logicAnd(isPgpuReady, isPciReady)

const manufacturerInfo = computed(() => getHostManufacturerInfo(host))

const coreSocketInfo = computed(() => getHostCoreSocketInfo(host))

const devicesNames = useArrayReduce(
  () => pGpusByHost.value.get(host.$ref) ?? [],
  (acc, pGpu) => {
    const deviceName = getPciByOpaqueRef(pGpu.PCI)?.device_name

    if (!deviceName) {
      return acc
    }

    return acc ? `${acc}, ${deviceName}` : deviceName
  },
  ''
)
</script>
