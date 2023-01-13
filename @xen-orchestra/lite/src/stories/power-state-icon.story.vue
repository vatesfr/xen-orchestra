<template>
  <ComponentStory
    :params="[
      prop('state')
        .enum('Running', 'Suspended', 'Halted', 'Paused')
        .required()
        .preset('Running')
        .widget(),
    ]"
    v-slot="{ properties }"
  >
    <PowerStateIcon style="font-size: 10rem" v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import PowerStateIcon from "@/components/PowerStateIcon.vue";
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import { prop } from "@/libs/story/story-param";
</script>

<style lang="postcss" scoped></style>
