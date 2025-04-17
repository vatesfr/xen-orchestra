<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('label').type('string').required().widget().preset('title'),
      prop('value').type('string').required().widget().preset('93.2%'),
      prop('date').type('Date | number | string').required(),
      prop('description').type('string').required(),
      prop('size').type('string').enum('small', 'large').required().widget().preset('large'),
      slot('objectLink').help('an object for represent emiter of alarms'),
    ]"
  >
    <UiAlarmItem
      :size="properties.size"
      :label="properties.label"
      :value="properties.value"
      :date="Date.now()"
      description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
    >
      <template #objectLink>
        <div class="object-link">
          <UiObjectIcon size="large" type="host" state="running" />
          <UiLink size="medium" to="google.com">VX1</UiLink>
        </div>
      </template>
    </UiAlarmItem>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import UiAlarmItem from '@core/components/ui/alarm-item/UiAlarmItem.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
</script>
