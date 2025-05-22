<template>
  <UiCard>
    <UiTitle>
      {{ $t('hardware-specifications') }}
    </UiTitle>
    <VtsQuickInfoRow
      :label="$t('manufacturer-info')"
      :value="`${host.bios_strings['system-manufacturer']} (${host.bios_strings['system-product-name']})`"
    />
    <VtsQuickInfoRow
      :label="$t('bios-info')"
      :value="`${host.bios_strings['bios-vendor']} (${host.bios_strings['bios-version']})`"
    />
    <VtsQuickInfoRow :label="$t('cpu-model')" :value="host.cpu_info.modelname" />
    <VtsQuickInfoRow :label="$t('core-socket')" :value="`${host.cpu_info.cpu_count} (${host.cpu_info.socket_count})`" />
    <VtsQuickInfoRow disabled :label="$t('hyper-threading')" />
    <VtsQuickInfoRow :label="$t('gpus')">
      <template #value>
        <template v-if="pGpus.length > 0">
          {{ pGpusIds }}
        </template>
        <template v-else>
          {{ $t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow disabled :label="$t('system-disks-health')" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { usePgpuStore } from '@/stores/xen-api/pgpu.store.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'

const { host } = defineProps<{
  host: XenApiHost
}>()

const { pGpusByHost } = usePgpuStore().subscribe()

const pGpus = computed(() => pGpusByHost.value.get(host.$ref) ?? [])

const pGpusIds = computed(() => pGpus.value.map(pGpu => pGpu.uuid).join(', '))
</script>
