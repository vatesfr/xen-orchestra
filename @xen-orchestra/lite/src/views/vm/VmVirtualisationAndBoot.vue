<template>
  <UiCard class="vm-virtualisation-and-boot">
    <UiTitle>
      {{ $t('Virtualization-boot-settings') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('virtualization-mode')" :value="undefined" />
    <VtsQuickInfoRow :label="$t('Secure-boot')">
      <template #value>
        <UiInfo :accent="true ? 'success' : 'muted'">
          {{ true ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('virtual-tpm')" :value="vm?.VTPMs.join(', ')" />
    <VtsQuickInfoRow :label="$t('Viridian')">
      <template #value>
        <UiInfo :accent="true ? 'success' : 'muted'">
          {{ true ? $t('enabled') : $t('disabled') }}
        </UiInfo>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow
      :label="$t('manage-Citrix-PV-drivers-via-Windows-Update')"
      class="text-ellipsis"
      :value="vm?.uuid"
    />
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
// not fond
// pvDriversVersionis
// NestedVirtEnabled
// secureBoot
// virtualizationMode
// viridian
</script>
