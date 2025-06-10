<template>
  <UiCard>
    <UiTitle>
      {{ t('hardware-specifications') }}
    </UiTitle>
    <VtsQuickInfoRow
      :label="t('manufacturer-info')"
      :value="`${host.bios_strings['system-manufacturer']} (${host.bios_strings['system-product-name']})`"
    />
    <VtsQuickInfoRow
      :label="t('bios-info')"
      :value="`${host.bios_strings['bios-vendor']} (${host.bios_strings['bios-version']})`"
    />
    <VtsQuickInfoRow :label="t('cpu-model')" :value="host.cpu_info.modelname" />
    <VtsQuickInfoRow :label="t('core-socket')" :value="`${host.cpu_info.cpu_count} (${host.cpu_info.socket_count})`" />
    <VtsQuickInfoRow :label="t('gpus')">
      <template v-if="isReady" #value>
        <template v-if="pciDevicesNames">
          {{ pciDevicesNames }}
        </template>
        <template v-else>
          {{ t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { usePciStore } from '@/stores/xen-api/pci.store.ts'
import { usePgpuStore } from '@/stores/xen-api/pgpu.store.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { logicAnd } from '@vueuse/math'
import { useArrayReduce } from '@vueuse/shared'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { t } = useI18n()

const { pGpusByHost, isReady: isPgpuReady } = usePgpuStore().subscribe()
const { getByOpaqueRef: getPciByOpaqueRef, isReady: isPciReady } = usePciStore().subscribe()

const isReady = logicAnd(isPgpuReady, isPciReady)

const pciDevicesNames = useArrayReduce(
  () => pGpusByHost.value.get(host.$ref) ?? [],
  (acc, pGpu) => {
    const deviceName = getPciByOpaqueRef(pGpu.PCI)?.device_name

    return deviceName ? (acc ? `${acc}, ${deviceName}` : deviceName) : acc
  },
  ''
)
</script>
