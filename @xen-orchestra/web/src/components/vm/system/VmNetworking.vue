<template>
  <UiCard>
    <UiTitle>
      {{ t('networking') }}
    </UiTitle>
    <VtsQuickInfoRow :label="t('nic-type')" :value="vm.nicType" />
  </UiCard>
</template>

<script setup lang="ts">
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

defineProps<{ vm: XoVm }>()

const { t } = useI18n()
</script>
