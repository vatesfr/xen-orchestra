<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('alarmType').type('string').preset('VM').required().widget(),
      prop('alarmLevel').type('number').preset(0.8).required().widget(),
      prop('alarmTrigger-level').type('number').preset(0.8).required().widget(),
      slot(),
      setting('defaultSlotContent').preset('Description content').widget(text()),
    ]"
  >
    <UiTable>
      <AlarmLine
        :alarm-level="properties.alarmLevel"
        :alarm-type="properties.alarmType"
        :alarm-trigger-level="properties.alarmTriggerLevel"
        :alarm-cls="properties.alarmCls"
      >
        {{ settings.defaultSlotContent }}
        <template #objectLink>
          <ObjectLink :type="rawTypeToType(alarm.cls)" :uuid="alarm.obj_uuid" />
        </template>
        <template #time>
          <div v-tooltip="new Date(parseDateTime(alarm.timestamp)).toLocaleString()">
            <RelativeTime :date="alarm.timestamp" />
          </div>
        </template>
      </AlarmLine>
    </UiTable>
  </ComponentStory>
</template>

<script lang="ts" setup generic="T extends RawObjectType">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import UiTable from '@/components/ui/UiTable.vue'
import AlarmLine from '@core/components/AlarmLine.vue'
import ObjectLink from '@/components/ObjectLink.vue'
import RelativeTime from '@/components/RelativeTime.vue'
import { prop, slot, setting } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import { vTooltip } from '@core/directives/tooltip.directive'
import { parseDateTime } from '@/libs/utils'
import { rawTypeToType } from '@/libs/xen-api/xen-api.utils'
import type { RawObjectType, RecordUuid, RecordRef } from '@/libs/xen-api/xen-api.types'
import type { XenApiAlarm } from '@/types/xen-api'

const createRecordRef = <T,>(value: string): T => value as unknown as T

const alarm: XenApiAlarm<RawObjectType> = {
  $ref: createRecordRef<RecordRef<'message'>>('message-ref'),
  uuid: createRecordRef<RecordUuid<'message'>>('message-uuid'),
  cls: 'VM',
  obj_uuid: createRecordRef<RecordUuid<'vm'>>('1234'),
  timestamp: new Date().toISOString(),
  level: 0.8,
  triggerLevel: 0.8,
  type: 'cpu_usage',
  body: 'Description content',
  name: 'Alarm name',
  priority: 0,
}
</script>
