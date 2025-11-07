<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <UiLabelValue :label="t('name')" :value="pool.name_label" />
    <UiLabelValue :label="t('uuid')" :value="pool.id" />
    <UiLabelValue :label="t('description')" :value="pool.name_description" />
    <UiLabelValue :label="t('tags')" :value="pool.tags" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XoPool } from '@/types/xo/pool.type'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ pool: XoPool }>()

const { t } = useI18n()
</script>
