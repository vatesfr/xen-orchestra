<template>
  <UiCard class="pool-dashboard-alarms">
    <UiCardTitle>{{ t('alarms') }}</UiCardTitle>
    <!--    TODO Remove when endpoint and component are available -->
    <ul v-if="records.length > 0">
      <li v-for="(alarm, index) in records" :key="index">
        {{ alarm.body.name }}
      </li>
    </ul>
  </UiCard>
</template>

<script setup lang="ts">
import { useAlarmStore } from '@/stores/xo-rest-api/alarm.store.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { records } = useAlarmStore().subscribe()
</script>

<style lang="postcss" scoped>
.pool-dashboard-alarms {
  height: 40rem;
  overflow: auto;
}
</style>
