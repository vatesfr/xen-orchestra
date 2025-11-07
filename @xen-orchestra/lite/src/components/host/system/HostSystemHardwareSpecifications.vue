<template>
  <UiCard>
    <UiTitle>
      {{ t('hardware-specifications') }}
    </UiTitle>
    <UiLabelValue
      :label="t('manufacturer-info')"
      :value="`${host.bios_strings['system-manufacturer']} (${host.bios_strings['system-product-name']})`"
    />
    <UiLabelValue
      :label="t('bios-info')"
      :value="`${host.bios_strings['bios-vendor']} (${host.bios_strings['bios-version']})`"
    />
    <UiLabelValue :label="t('cpu-model')" :value="host.cpu_info.modelname" />
    <UiLabelValue :label="t('core-socket')" :value="`${host.cpu_info.cpu_count} (${host.cpu_info.socket_count})`" />
    <UiLabelValue :label="t('gpus')">
      <template v-if="isReady" #value>
        <template v-if="devicesNames">
          {{ devicesNames }}
        </template>
        <template v-else>
          {{ t('none') }}
        </template>
      </template>
    </UiLabelValue>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { usePciStore } from '@/stores/xen-api/pci.store.ts'
import { usePgpuStore } from '@/stores/xen-api/pgpu.store.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
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
