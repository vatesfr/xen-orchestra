<template>
  <ComponentStory v-slot="{ properties }" :params="[prop('enabled').required().preset(true).widget()]">
    <VtsEnabledState v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import VtsEnabledState from '@core/enabled-state/VtsEnabledState.vue'
</script>
