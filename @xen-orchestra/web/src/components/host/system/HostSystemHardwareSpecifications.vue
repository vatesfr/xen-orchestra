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
    <VtsQuickInfoRow :label="$t('cpu-model')" :value="host.CPUs.modelname" />
    <VtsQuickInfoRow :label="$t('core-socket')" :value="`${host.cpus.cores} (${host.cpus.sockets})`" />
    <VtsQuickInfoRow :label="$t('hyper-threading')">
      <!--        Waiting for the API endpoint -->
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('gpus')">
      <!--        Waiting for the API endpoint -->
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('system-disks-health')">
      <!--        Waiting for the API endpoint -->
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoHost } from '@/types/xo/host.type.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

defineProps<{
  host: XoHost
}>()
</script>
