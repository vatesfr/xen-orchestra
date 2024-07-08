<template>
  <div class="backup-repository">
    <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
    <CardTitle>
      {{ $t('backup-repository') }} (local, NFS)
      <template #description>{{ $t('for-backup') }}</template>
    </CardTitle>
    <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
    <StackedBarWithLegends :segments="segments" :max-value="50" />
    <div class="numbers">
      <CardNumbers :value="44.5" unit="G.B" label="Used for backup" size="medium" />
      <CardNumbers :value="5.5" unit="G.B" label="Available" size="medium" />
      <CardNumbers :value="50" unit="G.B" label="Total" size="medium" />
    </div>
  </div>
</template>

<script setup lang="ts">
import CardTitle from '@core/components/card/CardTitle.vue'
import CardNumbers from '@core/components/CardNumbers.vue'
import StackedBarWithLegends from '@core/components/stacked-bar/StackedBarWithLegends.vue'

const segments = [
  { label: 'XO Backups', value: 10.5, color: 'default', unit: 'G.B' },
  { label: 'Other', value: 6.5, color: 'warning', unit: 'G.B' },
]
</script>

<style scoped lang="scss">
.backup-repository {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  width: 100%;
}

.numbers {
  display: flex;
  justify-content: space-between;
}
</style>
