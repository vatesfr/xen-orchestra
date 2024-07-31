<template>
  <UiCard>
    <CardTitle>
      {{ $t('alarms')
      }}<template #info>
        <UiCounter color="error" :value="alarms.length" size="medium" />
      </template>
    </CardTitle>
    <table>
      <!-- 
      <AlarmLine :alarm-level=""
        :alarm-type=""
        :alarm-trigger-level=""
        :alarm-cls=""><template #objectLink>
          <ObjectLink :type="rawTypeToType(alarm.cls)" :uuid="alarm.obj_uuid" />
        </template>
       <template #time>
          <div v-tooltip="new Date(parseDateTime(alarm.timestamp)).toLocaleString()">
            <RelativeTime :date="alarm.timestamp" />
          </div>
        </template>
      </AlarmLine> 
        -->
    </table>
  </UiCard>
</template>

<script setup lang="ts">
import CardTitle from '@core/components/card/CardTitle.vue'
import UiCard from '@core/components/UiCard.vue'
import UiCounter from '@core/components/UiCounter.vue'

const alarms = [
  {
    level: 1,
    triggerLevel: 2,
    type: 'cpu_usage',
  },
  {
    level: 4,
    triggerLevel: 3,
    type: 'network_usage',
  },
  {
    level: 0,
    triggerLevel: 6,
    type: 'disk_usage',
  },
  {
    level: 1,
    triggerLevel: 3,
    type: 'fs_usage',
  },
  {
    level: 2,
    triggerLevel: 4,
    type: 'log_fs_usage',
  },
  {
    level: 1,
    triggerLevel: 1,
    type: 'mem_usage',
  },
  {
    level: 6,
    triggerLevel: 2,
    type: 'physical_utilisation',
  },
]
</script>
