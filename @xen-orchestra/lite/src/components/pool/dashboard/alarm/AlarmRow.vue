<template>
  <tr>
    <th>
      <div v-tooltip="new Date(parseDateTime(alarm.timestamp)).toLocaleString()" class="ellipsis time">
        <RelativeTime :date="alarm.timestamp" />
      </div>
    </th>
    <td>
      <div ref="descriptionElement" v-tooltip="hasTooltip" class="ellipsis description">
        {{ $t(`alarm-type.${alarm.type}`, { n: alarm.triggerLevel * 100 }) }}
      </div>
    </td>
    <td class="level">{{ alarm.level * 100 }}%</td>
    <td class="on">{{ $t('on-object', { object: alarm.cls }) }}</td>
    <td class="object">
      <ObjectLink :type="rawTypeToType(alarm.cls)" :uuid="alarm.obj_uuid" />
    </td>
  </tr>
</template>

<script lang="ts" setup generic="T extends RawObjectType">
import ObjectLink from '@/components/ObjectLink.vue'
import RelativeTime from '@/components/RelativeTime.vue'
import { vTooltip } from '@/directives/tooltip.directive'
import { hasEllipsis, parseDateTime } from '@/libs/utils'
import type { RawObjectType } from '@/libs/xen-api/xen-api.types'
import { rawTypeToType } from '@/libs/xen-api/xen-api.utils'
import type { XenApiAlarm } from '@/types/xen-api'
import { computed, ref } from 'vue'

defineProps<{
  alarm: XenApiAlarm<T>
}>()

const descriptionElement = ref<HTMLElement>()
const hasTooltip = computed(() => hasEllipsis(descriptionElement.value))
</script>

<style lang="postcss" scoped>
.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.level {
  color: var(--color-red-base);
  font-size: 1.4rem;
  font-weight: 700;
}
.on {
  white-space: nowrap;
}
.object-link {
  white-space: nowrap;
}
</style>
