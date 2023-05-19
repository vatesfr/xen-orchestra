<template>
  <ComponentStory
    :params="[
      prop('state')
        .enum(...Object.values(POWER_STATE))
        .required()
        .preset(POWER_STATE.RUNNING)
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
import { POWER_STATE } from "@/libs/xen-api";
</script>

<style lang="postcss" scoped></style>
