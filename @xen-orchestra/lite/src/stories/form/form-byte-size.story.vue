<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      model().type('number').required().preset(4096).help('The size in bytes'),
    ]"
  >
    <FormByteSize v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import FormByteSize from "@/components/form/FormByteSize.vue";
import { model } from "@/libs/story/story-param";
</script>
