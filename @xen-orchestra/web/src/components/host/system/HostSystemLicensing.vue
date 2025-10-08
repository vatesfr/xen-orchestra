<template>
  <UiCard>
    <UiTitle>
      {{ t('licensing') }}
    </UiTitle>
    <UiLabelValue :label="t('license-type')">
      <!--        Waiting for the API endpoint -->
    </UiLabelValue>
    <UiLabelValue :label="t('license-socket')">
      <!--        Waiting for the API endpoint -->
    </UiLabelValue>
    <UiLabelValue :label="t('expiration-date')">
      <!--        Waiting for the API endpoint -->
    </UiLabelValue>
  </UiCard>
</template>

<script setup lang="ts">
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
