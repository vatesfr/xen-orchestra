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
    <UiLabelValue :label="t('cpu-model')" :value="host.CPUs.modelname" />
    <UiLabelValue :label="t('core-socket')" :value="`${host.cpus.cores} (${host.cpus.sockets})`" />
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
import { useXoPciCollection } from '@/remote-resources/use-xo-pci-collection.ts'
import { useXoPgpuCollection } from '@/remote-resources/use-xo-pgpu-collection.ts'
import type { XoHost } from '@/types/xo/host.type.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { logicAnd } from '@vueuse/math'
import { useArrayReduce } from '@vueuse/shared'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { getPciById, arePcisReady } = useXoPciCollection()
const { getPgpuById, arePgpusReady } = useXoPgpuCollection()

const isReady = logicAnd(arePgpusReady, arePcisReady)

const devicesNames = useArrayReduce(
  () => host.PGPUs ?? [],
  (acc, pGpuId) => {
    const pciId = getPgpuById(pGpuId)?.pci

    if (!pciId) {
      return acc
    }

    const deviceName = getPciById(pciId)?.device_name

    if (!deviceName) {
      return acc
    }

    return acc ? `${acc}, ${deviceName}` : deviceName
  },
  ''
)
</script>
