<template>
  <UiCard>
    <UiTitle>
      {{ t('virtualization-boot-settings') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('virtualization-mode')" :value="vm.virtualizationMode" />
      <VtsTabularKeyValueRow :label="t('secure-boot')">
        <template #value>
          <VtsStatus :status="vm.secureBoot" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('boot-firmware')" :value="vm.boot?.firmware" />
      <VtsTabularKeyValueRow :label="t('virtual-tpm')" :value="vm.VTPMs.length > 0 ? vm.VTPMs.join(', ') : t('none')" />
      <VtsTabularKeyValueRow :label="t('viridian')">
        <template #value>
          <VtsStatus :status="vm.viridian" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('manage-citrix-pv-drivers-via-windows-update')">
        <template #value>
          <VtsStatus :status="vm.hasVendorDevice" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('nested-virtualization')">
        <template #value>
          <VtsStatus :status="vm.isNestedVirtEnabled" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ vm: FrontXoVm }>()

const { t } = useI18n()
</script>
