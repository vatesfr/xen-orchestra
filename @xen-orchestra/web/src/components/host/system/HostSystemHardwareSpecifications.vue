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
      <template #value>
        <!-- TODO: display PGPUs name when available -->
        <template v-if="host.PGPUs.length > 0">
          {{ pGpusIds }}
        </template>
        <template v-else>
          {{ t('none') }}
        </template>
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoHost } from '@/types/xo/host.type.ts'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const pGpusIds = computed(() => host.PGPUs.join(', '))
</script>
