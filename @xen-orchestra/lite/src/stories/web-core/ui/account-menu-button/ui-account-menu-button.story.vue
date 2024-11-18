<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('size').type(`'small' | 'medium'`).enum('small', 'medium').required().preset('medium').widget(),
      prop('selected').bool().widget(),
    ]"
  >
    <UiAccountMenuButton v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiAccountMenuButton from '@core/components/ui/account-menu-button/UiAccountMenuButton.vue'
</script>
