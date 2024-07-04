<template>
  <UiCard>
    <CardTitle>{{ $t('patches') }}</CardTitle>
    <DonutWithLegends
      :segments="[
        {
          label: $t('up-to-date'),
          value: 4,
          color: 'success',
        },
        {
          label: $t('missing-patches'),
          value: 5,
          color: 'warning',
        },
      ]"
    >
      <LegendTitle>{{ $t('servers') }}</LegendTitle>
    </DonutWithLegends>
    <UiSeparator />
    <DonutWithLegends
      :segments="[
        {
          label: $t('up-to-date'),
          value: 2,
          color: 'success',
        },
        {
          label: $t('missing-patches'),
          value: 6,
          color: 'warning',
        },
        {
          label: 'EOL',
          value: 10,
          color: 'error',
          tooltip: $t('end-of-life'),
        },
      ]"
    >
      <LegendTitle>{{ $t('hosts') }}</LegendTitle>
    </DonutWithLegends>
  </UiCard>
</template>

<script setup lang="ts">
import DonutWithLegends from '@/components/DonutWithLegends.vue'
import CardTitle from '@core/components/card/CardTitle.vue'
import LegendTitle from '@core/components/LegendTitle.vue'
import UiCard from '@core/components/UiCard.vue'
import UiSeparator from '@core/components/UiSeparator.vue'
</script>
