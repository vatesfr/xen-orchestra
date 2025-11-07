<template>
  <UiCard>
    <UiTitle>
      {{ t('virtualization-boot-settings') }}
    </UiTitle>
    <UiLabelValue :label="t('virtualization-mode')" :value="vm.virtualizationMode" />
    <UiLabelValue :label="t('secure-boot')">
      <template #value>
        <VtsStatus :status="vm.secureBoot" />
      </template>
    </UiLabelValue>
    <UiLabelValue :label="t('virtual-tpm')" :value="vm.VTPMs.length > 0 ? vm.VTPMs.join(', ') : t('none')" />
    <UiLabelValue :label="t('viridian')">
      <template #value>
        <VtsStatus :status="vm.viridian" />
      </template>
    </UiLabelValue>
    <UiLabelValue :label="t('manage-citrix-pv-drivers-via-windows-update')">
      <template #value>
        <VtsStatus :status="vm.hasVendorDevice" />
      </template>
    </UiLabelValue>
    <UiLabelValue :label="t('nested-virtualization')">
      <template #value>
        <VtsStatus :status="vm.isNestedVirtEnabled" />
      </template>
    </UiLabelValue>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ vm: XoVm }>()

const { t } = useI18n()
</script>
