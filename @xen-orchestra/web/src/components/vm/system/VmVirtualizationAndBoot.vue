<template>
  <UiCard class="vm-virtualization-and-boot">
    <UiTitle>
      {{ $t('virtualization-boot-settings') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('virtualization-mode')" :value="vm.virtualizationMode" />
    <VtsQuickInfoRow :label="$t('secure-boot')">
      <template #value>
        <VtsEnabledState :enabled="vm.secureBoot" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('virtual-tpm')" :value="vm.VTPMs.length > 0 ? vm.VTPMs.join(', ') : $t('none')" />
    <VtsQuickInfoRow :label="$t('viridian')">
      <template #value>
        <VtsEnabledState :enabled="vm.viridian" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('manage-citrix-pv-drivers-via-windows-update')">
      <template #value>
        <VtsEnabledState :enabled="vm.hasVendorDevice" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('nested-virtualization')">
      <template #value>
        <VtsEnabledState :enabled="vm.isNestedVirtEnabled" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import VtsEnabledState from '@core/enabled-state/VtsEnabledState.vue'

defineProps<{ vm: XoVm }>()
</script>
