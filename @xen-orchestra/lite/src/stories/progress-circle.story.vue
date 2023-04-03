<template>
  <ComponentStory
    :params="[
      prop('value').num().preset(25).required().widget(),
      prop('max-value').num().default(100).widget(),
    ]"
    :presets="presets"
    v-slot="{ properties }"
  >
    <ProgressCircle v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ProgressCircle from "@/components/ProgressCircle.vue";
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import { prop } from "@/libs/story/story-param";

const presets = {
  "Half of 500": {
    props: {
      "max-value": 500,
      value: 250,
    },
  },
  "75% of 300": {
    props: {
      "max-value": 300,
      value: 225,
    },
  },
};
</script>

<style lang="postcss" scoped>
.progress-circle {
  max-width: 30rem;
}
</style>
