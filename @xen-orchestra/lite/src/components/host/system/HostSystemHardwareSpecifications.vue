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
    <VtsQuickInfoRow :label="$t('hyper-threading')" />
    <VtsQuickInfoRow :label="$t('gpus')" />
    <VtsQuickInfoRow :label="$t('system-disks-health')" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

defineProps<{
  host: XenApiHost
}>()
</script>
