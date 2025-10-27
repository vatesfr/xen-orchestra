<template>
  <UiCard>
    <UiTitle>
      {{ t('networking') }}
    </UiTitle>
    <UiLabelValue :label="t('nic-type')" :value="vm.platform.nic_type" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ vm: XenApiVm }>()

const { t } = useI18n()
</script>
