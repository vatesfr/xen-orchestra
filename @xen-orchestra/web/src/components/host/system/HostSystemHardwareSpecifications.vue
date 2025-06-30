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
    <VtsQuickInfoRow :label="t('cpu-model')" :value="host.CPUs.modelname" />
    <VtsQuickInfoRow :label="t('core-socket')" :value="`${host.cpus.cores} (${host.cpus.sockets})`" />
    <VtsQuickInfoRow :label="t('gpus')">
      <template v-if="isReady" #value>
        <template v-if="devicesNames">
          {{ devicesNames }}
        </template>
        <template v-else>
          {{ t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import { usePciStore } from '@/stores/xo-rest-api/pci.store'
import { usePgpuStore } from '@/stores/xo-rest-api/pgpu.store'
import type { XoHost } from '@/types/xo/host.type.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { logicAnd } from '@vueuse/math'
import { useArrayReduce } from '@vueuse/shared'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { get: getPci, isReady: isPciReady } = usePciStore().subscribe()
const { get: getGpu, isReady: isPgpuReady } = usePgpuStore().subscribe()

const isReady = logicAnd(isPgpuReady, isPciReady)

const devicesNames = useArrayReduce(
  () => host.PGPUs ?? [],
  (acc, pGpuId) => {
    const pciId = getGpu(pGpuId)?.pci

    if (!pciId) {
      return acc
    }

    const deviceName = getPci(pciId)?.device_name

    if (!deviceName) {
      return acc
    }

    return acc ? `${acc}, ${deviceName}` : deviceName
  },
  ''
)
</script>
