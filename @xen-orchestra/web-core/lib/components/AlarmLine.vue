<template>
  <tbody v-if="isMobile" class="alarm-line" @click="handleCollapse()">
    <tr>
      <td class="description" colspan="5">
        <div v-tooltip class="ellipsis">
          <UiIcon v-if="$slots.default" :icon="descriptionCollapsed ? faAngleDown : faAngleRight" color="info" />
          {{ $t(`alarm-type.${alarmType}`, { n: alarmTriggerLevel * 100 }) }}
        </div>
      </td>
    </tr>
    <tr v-if="!descriptionCollapsed && $slots.default">
      <td class="description-content" colspan="5">
        <slot />
      </td>
    </tr>
    <tr class="alarm-details">
      <td>
        <div v-if="$slots.time" class="ellipsis time"><slot name="time" /></div>
      </td>
      <td class="level typo h7-semi-bold">{{ alarmLevel * 100 }}%</td>
      <td class="on">{{ $t('on-object', { object: alarmCls }) }}</td>
      <td class="object">
        <slot name="objectLink" />
      </td>
    </tr>
  </tbody>

  <tbody v-else class="alarm-line" @click="handleCollapse()">
    <tr>
      <th class="table-header">
        <UiIcon v-if="$slots.default" :icon="descriptionCollapsed ? faAngleDown : faAngleRight" color="info" />
        <div v-if="$slots.time" class="ellipsis time">
          <slot name="time" />
        </div>
      </th>
      <td class="description">
        <div v-tooltip class="ellipsis">
          {{ $t(`alarm-type.${alarmType}`, { n: alarmTriggerLevel * 100 }) }}
        </div>
      </td>
      <td class="level typo h7-semi-bold">{{ alarmLevel * 100 }}%</td>
      <td class="on">{{ $t('on-object', { object: alarmCls }) }}</td>
      <td v-if="$slots.objectLink" class="object">
        <slot name="objectLink" />
      </td>
    </tr>
    <tr v-if="!descriptionCollapsed && $slots.default">
      <td class="description-content" colspan="5">
        <slot />
      </td>
    </tr>
  </tbody>
</template>

<script lang="ts" setup>
import { useUiStore } from '@core/stores/ui.store'
import { storeToRefs } from 'pinia'
import { useToggle } from '@vueuse/shared'
import UiIcon from '@core/components/icon/UiIcon.vue'
import { faAngleDown, faAngleRight } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  alarmLevel: number
  alarmType: string
  alarmTriggerLevel: number
  alarmCls: string
}>()

defineSlots<{
  default: () => void
  objectLink: () => void
  time: () => void
}>()

const uiStore = useUiStore()
const { isMobile } = storeToRefs(uiStore)
const [descriptionCollapsed, handleCollapse] = useToggle(true)
</script>

<style lang="postcss" scoped>
.alarm-line {
  cursor: pointer;
  width: 100%;
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
}

.alarm-details {
  padding: 0 0 1rem 2.75rem;
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;

  td {
    border-top: none !important;
    padding: 0 !important;
  }
}
</style>
