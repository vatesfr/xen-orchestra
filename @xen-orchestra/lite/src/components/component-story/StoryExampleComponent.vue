<template>
  <div class="story-example-component">
    Default slot:
    <div class="slot">
      <slot />
    </div>
    Named slot:
    <div class="slot">
      <slot name="named-slot" />
    </div>
    Named scoped slot:
    <div class="slot">
      <slot :moon-distance="moonDistance" name="named-scoped-slot" />
    </div>
    Props:
    <div>Required string prop: {{ imString }}</div>
    <div>Required number prop: {{ imNumber }}</div>
    <div>Optional string prop: {{ imOptional }}</div>
    <div>Optional string prop with default: {{ imOptionalWithDefault }}</div>
    Input for default v-model:
    <input
      :value="modelValue"
      @input="
        emit('update:modelValue', ($event.target as HTMLInputElement)?.value)
      "
    />
    Input for v-model:customModel:
    <input
      :value="customModel"
      @input="
        emit('update:customModel', ($event.target as HTMLInputElement)?.value)
      "
    />
    Event with no arguments:
    <button type="button" @click="emit('click')">Click me</button>
    Event with argument:
    <button type="button" @click="emit('clickWithArg', 'my-id')">
      Click me
    </button>
  </div>
</template>

<script lang="ts" setup>
const moonDistance = 384400;

withDefaults(
  defineProps<{
    imString: string;
    imNumber: number;
    imOptional?: string;
    imOptionalWithDefault?: string;
    modelValue?: string;
    customModel?: string;
  }>(),
  {
    imOptionalWithDefault: "My default value",
  }
);

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "update:customModel", value: string): void;
  (event: "click"): void;
  (event: "clickWithArg", id: string): void;
}>();
</script>

<style lang="postcss" scoped>
.story-example-component {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.slot {
  padding: 1rem;
  border: 1px dashed black;
  border-radius: 1rem;

  &:empty {
    display: none;
  }
}
</style>
