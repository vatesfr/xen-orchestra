<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('size').type('UserLogoSize').enum('extra-small', 'small', 'medium').widget()]"
  >
    <UserLogo v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import UserLogo from '@core/components/user/UserLogo.vue'
</script>
