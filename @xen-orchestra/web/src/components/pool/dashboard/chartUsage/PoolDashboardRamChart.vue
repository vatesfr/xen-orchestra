<template>
  <UiCard color="error" class="linear-chart">
    <UiCardTitle>{{ t('pool-ram-usage') }}</UiCardTitle>
    <UiCardTitle>
      {{ t('last-week') }}
    </UiCardTitle>
  </UiCard>
</template>

<script lang="ts" setup>
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
