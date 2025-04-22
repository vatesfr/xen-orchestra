<template>
  <UiPanel>
    <UiTitle>
      {{ $t('Virtualization-boot-settings') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('Virtualization-mode')">
      <template #value>
        {{ vm.virtualizationMode }}
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('Secure-boot')">
      <template #value>
        <UiInfo :accent="vm.secureBoot ? 'success' : 'muted'">
          {{ vm.secureBoot ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('Virtual-TPM-(VTPM)')">
      <template #value>
        {{ vm.VTPMs }}
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('Viridian')">
      <template #value>
        <UiInfo :accent="vm.viridian ? 'success' : 'muted'">
          {{ vm.viridian ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('Manage-Citrix-PV-drivers-via-Windows-Update')">
      <template #value>
        <!-- no data -->
        <UiInfo accent="danger">{{ $t('no-data') }}</UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('Nested-virtualization')">
      <UiInfo :accent="vm.isNestedVirtEnabled ? 'success' : 'muted'">
        {{ vm.isNestedVirtEnabled ? $t('enabled') : $t('disabled') }}
      </UiInfo>
    </VtsQuickInfoRow>
  </UiPanel>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { vm } = defineProps<{ vm: XoVm }>()
</script>
