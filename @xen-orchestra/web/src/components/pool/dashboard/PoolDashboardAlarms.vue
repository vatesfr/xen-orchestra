<template>
  <UiCard class="pool-dashboard-alarms">
    <UiCardTitle>{{ t('alarms') }}</UiCardTitle>
    <VtsComingSoonHero type="card" />
  </UiCard>
</template>

<script setup lang="ts">
// import type { XoPool } from '@/types/xo/pool.type'
import VtsComingSoonHero from '@core/components/state-hero/VtsComingSoonHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
// const { pool } = defineProps<{
//   pool: XoPool
// }>()

// useAlarmStore().subscribe()
</script>

<style lang="postcss" scoped>
.pool-dashboard-alarms {
  height: 100%;
}
</style>
