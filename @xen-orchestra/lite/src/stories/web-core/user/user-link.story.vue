<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('route').type('RouteLocationRaw').preset('#'),
      prop('disabled').bool().widget(),
      prop('username').str().required().preset('username').widget(),
    ]"
  >
    <UserLink v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UserLink from '@core/components/user/UserLink.vue'
</script>
