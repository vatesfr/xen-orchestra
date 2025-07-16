<template>
  <ComponentStory :params="[slot('default').help('a list of ui-alarm-item element')]">
    <div class="main-wrapper">
      <UiAlarmList>
        <UiAlarmItem label="Label" progress="93.2%" size="large" :description :date="Date.now()">
          <template #link>
            <UiObjectLink route="#">
              <template #icon>
                <UiObjectIcon size="medium" state="running" type="vm" />
              </template>
              VM1
            </UiObjectLink>
          </template>
        </UiAlarmItem>
        <UiAlarmItem label="Label" progress="93.2%" size="large" :description :date="Date.now()">
          <template #link>
            <UiObjectLink route="#">
              <template #icon>
                <UiObjectIcon size="medium" state="running" type="vm" />
              </template>
              VM1
            </UiObjectLink>
          </template>
        </UiAlarmItem>
        <UiAlarmItem label="Label" progress="93.2%" size="large" :description :date="Date.now()">
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
    </div>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import UiAlarmItem from '@core/components/ui/alarm-item/UiAlarmItem.vue'
import UiAlarmList from '@core/components/ui/alarm-list/UiAlarmList.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import { ref } from 'vue'

const description = ref(
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
)
</script>

<style scoped lang="postcss">
.main-wrapper {
  height: 20rem;
}
</style>
