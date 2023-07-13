<template>
  <ComponentStory
    :params="[slot().help('Can contains multiple FormInput and FormSelect')]"
  >
    <FormInputGroup>
      <FormInput v-model="model" />
      <FormInput v-model="model" />
      <FormSelect
        v-model="model"
        :options="['Option 1', 'Option 2', 'Option 3']"
      />
    </FormInputGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from "@/components/component-story/ComponentStory.vue";
import FormInput from "@/components/form/FormInput.vue";
import FormInputGroup from "@/components/form/FormInputGroup.vue";
import FormSelect from "@/components/form/FormSelect.vue";
import { slot } from "@/libs/story/story-param";
import { ref } from "vue";

const model = ref("");
</script>
