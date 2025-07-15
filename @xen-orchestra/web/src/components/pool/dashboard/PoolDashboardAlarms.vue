<template>
  <UiCard class="pool-dashboard-alarms">
    <UiCardTitle>
      {{ t('alarms') }} <UiCounter accent="danger" size="small" variant="primary" :value="records.length" />
    </UiCardTitle>
    <!--    TODO Change when the component is available -->
    <ul v-if="records.length > 0">
      <li v-for="(alarm, index) in records" :key="index">
        <p>{{ alarm.body.name }}</p>
        <p>{{ alarm.body.value }}</p>
        <p>{{ alarm.object.type }}</p>
        <p>{{ alarm.time }}</p>
        <VtsDivider type="stretch" />
      </li>
    </ul>
  </UiCard>
</template>

<script setup lang="ts">
import { useAlarmStore } from '@/stores/xo-rest-api/alarm.store.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { records } = useAlarmStore().subscribe()
</script>

<style lang="postcss" scoped>
.pool-dashboard-alarms {
  height: 46rem;
  overflow: auto;
}
</style>
