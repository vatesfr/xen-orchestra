<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('size').type('UserLogoSize').enum('extra-small', 'small', 'medium').required().preset('small').widget(),
    ]"
  >
    <UiUserLogo v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
</script>
