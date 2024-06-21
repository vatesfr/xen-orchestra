<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('alarmType').type('string').preset('VM').required().widget(),
      prop('alarmLevel').type('number').preset(0.8).required().widget(),
      prop('alarmTriggerLevel').type('number').preset(0.8).required().widget(),
      prop('alarmCls').type('string').preset('on SR').required().widget(),
      slot(),
      setting('defaultSlotContent').preset('Description content').widget(text()),
    ]"
  >
    <UiTable>
      <AlarmLine v-bind="properties">
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

<script lang="ts" setup>
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
// import type { XenApiAlarm } from '@/types/xen-api'

const alarm = {
  cls: 'VM',
  obj_uuid: '1234',
  timestamp: new Date().toISOString(),
}
</script>
