<template>
  <tr v-if="isMobile" class="mobile" @click="handleCollapse">
    <td v-if="isMobile" class="description" colspan="5">
      <div v-tooltip class="ellipsis">
        <ArrowCollapseButton :is-collapsed="!isDescriptionCollapsedRef" />
        {{ $t(`alarm-type.${alarm.type}`, { n: alarm.triggerLevel * 100 }) }}
      </div>
    </td>
  </tr>

  <tr v-if="!isDescriptionCollapsedRef && isMobile" class="collapsible-description">
    <td class="collapsible-description__content" colspan="5">
      {{ tempDescription }}
    </td>
  </tr>
  <tr v-if="isMobile" class="alarm-details" colspan="5">
    <div v-tooltip="new Date(parseDateTime(alarm.timestamp)).toLocaleString()" class="ellipsis time">
      <RelativeTime :date="alarm.timestamp" />
    </div>
    <td class="level typo h7-semi-bold">{{ alarm.level * 100 }}%</td>
    <td class="on">{{ $t('on-object', { object: alarm.cls }) }}</td>
    <td class="object">
      <ObjectLink :type="rawTypeToType(alarm.cls)" :uuid="alarm.obj_uuid" />
    </td>
  </tr>

  <tr v-if="isDesktop" class="desktop" @click="handleCollapse">
    <th class="table-header">
      <ArrowCollapseButton :is-collapsed="!isDescriptionCollapsedRef" />
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
  <tr v-if="!isDescriptionCollapsedRef && isDesktop" class="collapsible-description">
    <td class="collapsible-description__content" colspan="5">
      {{ tempDescription }}
    </td>
  </tr>
</template>

<script lang="ts" setup generic="T extends RawObjectType">
import ObjectLink from '@/components/ObjectLink.vue'
import RelativeTime from '@/components/RelativeTime.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { parseDateTime } from '@/libs/utils'
import type { RawObjectType } from '@/libs/xen-api/xen-api.types'
import { rawTypeToType } from '@/libs/xen-api/xen-api.utils'
import type { XenApiAlarm } from '@/types/xen-api'
import ArrowCollapseButton from '@core/components/ArrowCollapseButton.vue'
import { useUiStore } from '@core/stores/ui.store'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

defineProps<{
  alarm: XenApiAlarm<T>
}>()

const uiStore = useUiStore()
const { isMobile, isDesktop } = storeToRefs(uiStore)
const tempDescription =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.'
const isDescriptionCollapsedRef = ref(true)

function handleCollapse() {
  isDescriptionCollapsedRef.value = !isDescriptionCollapsedRef.value
}
</script>

<style lang="postcss" scoped>
.mobile,
.desktop {
  cursor: pointer;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (min-width: 768px) {
    padding-left: 0 !important;
  }
}

.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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

.collapsible-description__content {
  padding-top: 0 !important;
  border-top: none !important;
  font-size: 1.2rem;
  padding-left: 3rem !important;

  @media (min-width: 768px) {
    padding-left: 3.5rem !important;
  }
}

.alarm-details {
  padding: 0 0 1rem 2.8rem;
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
