<template>
  <UiCard class="linear-chart" color="error">
    <UiCardTitle>{{ t('network-throughput') }}</UiCardTitle>
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
