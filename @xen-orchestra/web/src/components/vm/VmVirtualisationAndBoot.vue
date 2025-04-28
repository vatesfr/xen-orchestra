<template>
  <UiCard class="vm-virtualisation-and-boot">
    <UiTitle>
      {{ $t('Virtualization-boot-settings') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('virtualization-mode')" :value="vm.virtualizationMode" />
    <VtsQuickInfoRow :label="$t('Secure-boot')">
      <template #value>
        <UiInfo :accent="vm.secureBoot ? 'success' : 'muted'">
          {{ vm.secureBoot ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('virtual-tpm')" :value="vm.VTPMs.join(', ')" />
    <VtsQuickInfoRow :label="$t('Viridian')">
      <template #value>
        <UiInfo :accent="vm.viridian ? 'success' : 'muted'">
          {{ vm.viridian ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow
      :label="$t('manage-Citrix-PV-drivers-via-Windows-Update')"
      class="text-ellipsis"
      :value="vm.pvDriversVersion"
    />
    <VtsQuickInfoRow :label="$t('Nested-virtualization')">
      <UiInfo :accent="vm.isNestedVirtEnabled ? 'success' : 'muted'">
        {{ vm.isNestedVirtEnabled ? $t('enabled') : $t('disabled') }}
      </UiInfo>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { vm } = defineProps<{ vm: XoVm }>()
</script>
