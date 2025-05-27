<template>
  <UiCard>
    <UiTitle>
      {{ $t('licensing') }}
    </UiTitle>
    <VtsQuickInfoRow />
    <VtsQuickInfoRow />
    <VtsQuickInfoRow />
  </UiCard>
</template>

<script setup lang="ts">
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
</script>
