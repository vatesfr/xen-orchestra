<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <UiLabelValue :label="t('name')" :value="vm.name_label" />
    <UiLabelValue :label="t('id')" :value="vm.id" />
    <UiLabelValue :label="t('description')" :value="vm.name_description" />
    <UiLabelValue :label="t('tags')" :value="vm.tags" />
    <UiLabelValue :label="t('os-name')" :value="vm.os_version?.name" />
    <UiLabelValue :label="t('os-kernel')" :value="vm.os_version?.uname" />
    <UiLabelValue :label="t('management-agent-version')" :value="vm.pvDriversVersion" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ vm: XoVm }>()

const { t } = useI18n()
</script>
