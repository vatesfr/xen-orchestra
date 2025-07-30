<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('date').type(`Date | number | string`).required().preset(Date.now()),
      prop('label').type('string').required().widget().preset('Label'),
      prop('percent').type('number').required().widget().preset(92),
      prop('description')
        .type('string')
        .preset(
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum'
        ),
      prop('size').type('string').enum('small', 'large').required().widget().preset('large'),
      slot('link').help('an object for represent emitter of alarms'),
    ]"
  >
    <UiAlarmList>
      <UiAlarmItem v-bind="properties">
        <template #link>
          <UiObjectLink route="#">
            <template #icon>
              <UiObjectIcon size="medium" state="running" type="vm" />
            </template>
            VM1
          </UiObjectLink>
        </template>
      </UiAlarmItem>
    </UiAlarmList>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import UiAlarmItem from '@core/components/ui/alarm-item/UiAlarmItem.vue'
import UiAlarmList from '@core/components/ui/alarm-list/UiAlarmList.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
</script>
