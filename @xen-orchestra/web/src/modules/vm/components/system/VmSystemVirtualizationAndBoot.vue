<template>
  <UiCard>
    <UiTitle>
      {{ t('virtualization-boot-settings') }}
    </UiTitle>
    <VtsQuickInfoRow :label="t('virtualization-mode')" :value="vm.virtualizationMode" />
    <VtsQuickInfoRow :label="t('secure-boot')">
      <template #value>
        <VtsStatus :status="vm.secureBoot" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('boot-firmware')" :value="vm.boot?.firmware" />
    <VtsQuickInfoRow :label="t('virtual-tpm')" :value="vm.VTPMs.length > 0 ? vm.VTPMs.join(', ') : t('none')" />
    <VtsQuickInfoRow :label="t('viridian')">
      <template #value>
        <VtsStatus :status="vm.viridian" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('manage-citrix-pv-drivers-via-windows-update')">
      <template #value>
        <VtsStatus :status="vm.hasVendorDevice" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('nested-virtualization')">
      <template #value>
        <VtsStatus :status="vm.isNestedVirtEnabled" />
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{ vm: XoVm }>()

const { t } = useI18n()
</script>
