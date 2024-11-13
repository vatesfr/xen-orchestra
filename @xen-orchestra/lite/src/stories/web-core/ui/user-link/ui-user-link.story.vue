<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('route').type('RouteLocationRaw').preset('#'),
      prop('disabled').bool().widget(),
      prop('username').str().required().preset('username').widget(),
    ]"
  >
    <UiUserLink v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UiUserLink from '@core/components/ui/user-link/UiUserLink.vue'
</script>
