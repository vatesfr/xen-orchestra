<template>
  <UiCard>
    <UiTitle>
      {{ t('licensing') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow />
      <VtsTabularKeyValueRow />
      <VtsTabularKeyValueRow />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
