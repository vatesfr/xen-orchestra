<template>
  <tbody v-if="isMobile" class="alarm-row" @click="handleCollapse()">
    <tr>
      <td class="description" colspan="5">
        <div v-tooltip class="ellipsis">
          <UiIcon :icon="descriptionCollapsed ? faAngleDown : faAngleRight" color="info" />
          {{ $t(`alarm-type.${alarm.type}`, { n: alarm.triggerLevel * 100 }) }}
        </div>
      </td>
    </tr>

    <tr v-if="!descriptionCollapsed">
      <td class="description-content" colspan="5">
        {{ description }}
      </td>
    </tr>
    <tr class="alarm-details">
      <td>
        <div v-tooltip="new Date(parseDateTime(alarm.timestamp)).toLocaleString()" class="ellipsis time">
          <RelativeTime :date="alarm.timestamp" />
        </div>
      </td>
      <td class="level typo h7-semi-bold">{{ alarm.level * 100 }}%</td>
      <td class="on">{{ $t('on-object', { object: alarm.cls }) }}</td>
      <td class="object">
        <ObjectLink :type="rawTypeToType(alarm.cls)" :uuid="alarm.obj_uuid" />
      </td>
    </tr>
  </tbody>

  <tbody v-else class="alarm-row" @click="handleCollapse()">
    <tr>
      <th class="table-header">
        <UiIcon :icon="descriptionCollapsed ? faAngleDown : faAngleRight" color="info" />
        <div v-tooltip="new Date(parseDateTime(alarm.timestamp)).toLocaleString()" class="ellipsis time">
          <RelativeTime :date="alarm.timestamp" />
        </div>
      </th>
      <td class="description">
        <div v-tooltip class="ellipsis">
          {{ $t(`alarm-type.${alarm.type}`, { n: alarm.triggerLevel * 100 }) }}
        </div>
      </td>
      <td class="level typo h7-semi-bold">{{ alarm.level * 100 }}%</td>
      <td class="on">{{ $t('on-object', { object: alarm.cls }) }}</td>
      <td class="object">
        <ObjectLink :type="rawTypeToType(alarm.cls)" :uuid="alarm.obj_uuid" />
      </td>
    </tr>
    <tr v-if="!descriptionCollapsed">
      <td class="description-content" colspan="5">
        {{ description }}
      </td>
    </tr>
  </tbody>
</template>

<script lang="ts" setup generic="T extends RawObjectType">
import ObjectLink from '@/components/ObjectLink.vue'
import RelativeTime from '@/components/RelativeTime.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { parseDateTime } from '@/libs/utils'
import type { RawObjectType } from '@/libs/xen-api/xen-api.types'
import { rawTypeToType } from '@/libs/xen-api/xen-api.utils'
import type { XenApiAlarm } from '@/types/xen-api'
import { useUiStore } from '@core/stores/ui.store'
import { storeToRefs } from 'pinia'
import { useToggle } from '@vueuse/shared'
import { ref } from 'vue'
import UiIcon from '@core/components/icon/UiIcon.vue'
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  alarm: XenApiAlarm<T>
}>()

const uiStore = useUiStore()
const { isMobile } = storeToRefs(uiStore)
const description = ref('')
const [descriptionCollapsed, handleCollapse] = useToggle(true)
</script>

<style lang="postcss" scoped>
.alarm-row {
  cursor: pointer;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (min-width: 768px) {
    padding-left: 0 !important;
    display: flex;
    align-items: center;
    gap: 1.6rem;
  }
}

.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: flex;
  gap: 1.6rem;
  align-items: center;

  @media (min-width: 768px) {
    display: inherit;
  }
}

.level {
  color: var(--color-red-base);
}
.on {
  white-space: nowrap;
}
.object-link {
  white-space: nowrap;
}

.description {
  padding-left: 0 !important;
}

.description-content {
  padding-top: 0 !important;
  border-top: none !important;
  font-size: 1.2rem;
  padding-left: 2.5rem !important;

  @media (min-width: 768px) {
    padding-left: 3rem !important;
  }
}

.alarm-details {
  padding: 0 0 1rem 2.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 1rem;

  td {
    border-top: none !important;
    padding: 0 !important;
  }
}
</style>
