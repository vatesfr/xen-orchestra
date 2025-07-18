<template>
  <UiCard class="pool-dashboard-alarms">
    <UiCardTitle>
      {{ t('alarms') }}
      <UiCounter
        v-if="alarmRecords.length"
        accent="danger"
        size="small"
        variant="primary"
        :value="alarmRecords.length"
      />
    </UiCardTitle>
    <UiAlarmList>
      <UiAlarmItem
        v-for="alarm in alarmRecords"
        :key="alarm.id"
        :label="alarm.body.name"
        :percent="Number(alarm.body.value)"
        size="large"
        :date="alarm.time * 1000"
      >
        <template #link>
          <AlarmLink :type="alarm.object.type" :uuid="alarm.object.uuid" />
        </template>
      </UiAlarmItem>
    </UiAlarmList>
  </UiCard>
</template>

<script setup lang="ts">
import AlarmLink from '@/components/pool/dashboard/AlarmLink.vue'
import { useAlarmStore } from '@/stores/xo-rest-api/alarm.store.ts'
import UiAlarmItem from '@core/components/ui/alarm-item/UiAlarmItem.vue'
import UiAlarmList from '@core/components/ui/alarm-list/UiAlarmList.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { records: alarmRecords } = useAlarmStore().subscribe()
</script>

<style lang="postcss" scoped>
.pool-dashboard-alarms {
  height: 46rem;
  overflow: auto;
}
</style>
