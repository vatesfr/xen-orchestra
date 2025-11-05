<template>
  <UiCard>
    <UiTitle>
      {{ t('storage-configuration') }}
    </UiTitle>
    <VtsQuickInfoRow :label="t('suspend-storage-repository')" :value="vm.suspendSr ?? t('none')" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ vm: XoVm }>()

const { t } = useI18n()
</script>
