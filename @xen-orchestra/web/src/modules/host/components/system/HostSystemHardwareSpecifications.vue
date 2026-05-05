<template>
  <UiCard>
    <UiTitle>
      {{ t('hardware-specifications') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow
        :label="t('manufacturer-info')"
        :value="`${host.bios_strings['system-manufacturer']} (${host.bios_strings['system-product-name']})`"
      />
      <VtsTabularKeyValueRow
        :label="t('bios-info')"
        :value="`${host.bios_strings['bios-vendor']} (${host.bios_strings['bios-version']})`"
      />
      <VtsTabularKeyValueRow :label="t('cpu-model')" :value="host.CPUs.modelname" />
      <VtsTabularKeyValueRow :label="t('core-socket')" :value="`${host.cpus.cores} (${host.cpus.sockets})`" />
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
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPciCollection } from '@/modules/pci/remote-resources/use-xo-pci-collection.ts'
import { useXoPgpuCollection } from '@/modules/pgpu/remote-resources/use-xo-pgpu-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { logicAnd } from '@vueuse/math'
import { useArrayReduce } from '@vueuse/shared'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
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
