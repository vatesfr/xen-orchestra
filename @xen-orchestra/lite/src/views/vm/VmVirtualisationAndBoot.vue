<template>
  <UiCard class="vm-virtualisation-and-boot">
    <UiTitle>
      {{ $t('Virtualization-boot-settings') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('virtualization-mode')" :value="virtualizationMode" />
    <VtsQuickInfoRow :label="$t('Secure-boot')">
      <template #value>
        <UiInfo :accent="vm?.platform.secureBoot ? 'success' : 'muted'">
          {{ vm?.platform.secureBoot ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('virtual-tpm')" :value="vm?.VTPMs.join(', ')" />
    <VtsQuickInfoRow :label="$t('Viridian')">
      <template #value>
        <UiInfo :accent="vm?.platform.viridian === 'true' ? 'success' : 'muted'">
          {{ vm?.platform.viridian === 'true' ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('manage-Citrix-PV-drivers-via-Windows-Update')" class="text-ellipsis">
      <template #value>
        <UiInfo accent="warning">
          {{ $t('error-no-data') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('Nested-virtualization')">
      <UiInfo :accent="vm?.is_vmss_snapshot ? 'success' : 'muted'">
        {{ vm?.is_vmss_snapshot ? $t('enabled') : $t('disabled') }}
      </UiInfo>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { vm } = defineProps<{ vm: XenApiVm | undefined }>()
/**
 * @see `packages/xo-server/src/xapi/utils.mjs`:57
 **/
const virtualizationMode =
  vm?.domain_type !== undefined && vm?.domain_type !== 'unspecified'
    ? vm?.domain_type
    : vm?.HVM_boot_policy === ''
      ? 'pv'
      : 'hvm'
</script>

<!--
 not fond
NestedVirtEnabled 
-->
