<template>
  <tr>
    <th>
      <div v-tooltip="new Date(parseDateTime(alarm.timestamp)).toLocaleString()" class="text-ellipsis time">
        <RelativeTime :date="alarm.timestamp" />
      </div>
    </th>
    <td>
      <div v-tooltip class="text-ellipsis description">
        {{ $t(`alarm-type.${alarm.type}`, { n: alarm.triggerLevel * 100 }) }}
      </div>
    </td>
    <td class="level typo-body-bold-small">
      <!-- Using `Math.min` because `alarm.level` can be `Infinity` -->
      {{ $n(Math.min(alarm.level, 1), 'percent') }}
    </td>
    <td class="on">{{ $t('on-object', { object: alarm.cls }) }}</td>
    <td class="object">
      <ObjectLink :type="rawTypeToType(alarm.cls)" :uuid="alarm.obj_uuid" />
    </td>
  </tr>
</template>

<script lang="ts" setup generic="T extends RawObjectType">
import ObjectLink from '@/components/ObjectLink.vue'
import RelativeTime from '@/components/RelativeTime.vue'
import { parseDateTime } from '@/libs/utils'
import type { RawObjectType } from '@/libs/xen-api/xen-api.types'
import { rawTypeToType } from '@/libs/xen-api/xen-api.utils'
import type { XenApiAlarm } from '@/types/xen-api'
import { vTooltip } from '@core/directives/tooltip.directive'

defineProps<{
  alarm: XenApiAlarm<T>
}>()
</script>

<style lang="postcss" scoped>
.level {
  color: var(--color-danger-txt-base);
}

.on {
  white-space: nowrap;
}

.object-link {
  white-space: nowrap;
}
</style>
