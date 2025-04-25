<template>
  <UiCard class="vm-virtualisation-and-boot">
    <UiTitle>
      {{ $t('Virtualization-boot-settings') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('virtualization-mode')">
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
    <VtsQuickInfoRow :label="$t('virtual-tpm')">
      <template #value>
        {{ vm.VTPMs.join(', ') }}
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('Viridian')">
      <template #value>
        <UiInfo :accent="vm.viridian ? 'success' : 'muted'">
          {{ vm.viridian ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('Manage-Citrix-PV-drivers-via-Windows-Update')" class="text-ellipsis">
      <template #value>
        {{ vm.pvDriversVersion }}
      </template>
    </VtsQuickInfoRow>
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

<style lang="postcss" scoped>
.vm-virtualisation-and-boot {
  background-color: var(--color-neutral-background-primary);
  border-inline-start: none;
}
</style>
