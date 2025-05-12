<template>
  <UiCard class="vm-virtualization-and-boot">
    <UiTitle>
      {{ $t('virtualization-boot-settings') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('virtualization-mode')" :value="vm.virtualizationMode" />
    <VtsQuickInfoRow :label="$t('secure-boot')">
      <template #value>
        <UiInfo :accent="vm.secureBoot ? 'success' : 'muted'">
          {{ vm.secureBoot ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('virtual-tpm')" :value="vm.VTPMs.length > 0 ? vm.VTPMs.join(', ') : $t('none')" />
    <VtsQuickInfoRow :label="$t('viridian')">
      <template #value>
        <UiInfo :accent="vm.viridian ? 'success' : 'muted'">
          {{ vm.viridian ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('manage-citrix-pv-drivers-via-windows-update')">
      <template #value>
        <UiInfo :accent="vm.hasVendorDevice ? 'success' : 'muted'">
          {{ vm.hasVendorDevice ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('nested-virtualization')">
      <template #value>
        <UiInfo :accent="vm.isNestedVirtEnabled ? 'success' : 'muted'">
          {{ vm.isNestedVirtEnabled ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

defineProps<{ vm: XoVm }>()
</script>
