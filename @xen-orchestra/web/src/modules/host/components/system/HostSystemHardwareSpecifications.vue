<template>
  <UiCard>
    <UiTitle>
      {{ t('hardware-specifications') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('manufacturer-info')" :value="manufacturerInfo" />
      <VtsTabularKeyValueRow :label="t('bios-info')" :value="biosInfo" />
      <VtsTabularKeyValueRow :label="t('cpu-model')" :value="host.CPUs.modelname" />
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
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostBiosInfo, getHostCoreSocketInfo, getHostManufacturerInfo } from '@/modules/host/utils/xo-host.util.ts'
import { useXoPciCollection } from '@/modules/pci/remote-resources/use-xo-pci-collection.ts'
import { useXoPgpuCollection } from '@/modules/pgpu/remote-resources/use-xo-pgpu-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { logicAnd } from '@vueuse/math'
import { useArrayReduce } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()

const manufacturerInfo = computed(() => getHostManufacturerInfo(host))

const biosInfo = computed(() => getHostBiosInfo(host))

const coreSocketInfo = computed(() => getHostCoreSocketInfo(host))

const { getPciById, arePcisReady } = useXoPciCollection()
const { getPgpuById, arePgpusReady } = useXoPgpuCollection()

const isReady = logicAnd(arePgpusReady, arePcisReady)

const devicesNames = useArrayReduce(
  () => host.PGPUs,
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
