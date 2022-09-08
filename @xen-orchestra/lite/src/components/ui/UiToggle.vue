<template>
  <label class="toggle">
    <input
      type="checkbox"
      :checked="props.value"
      :disabled="props.disabled"
      @change="onChange"
    />
    <span class="slider"></span>
  </label>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    onChange?: (value: boolean) => void;
    value?: boolean;
    scale?: number;
  }>(),
  {
    disabled: false,
    value: false,
    scale: 1,
  }
);

const onChange = (event: Event) => {
  if (props.onChange !== undefined) {
    props.onChange((event.target as HTMLInputElement).checked);
  }
};
</script>

<style lang="postcss" scoped>
.toggle {
  --scale: v-bind(scale);
  position: relative;
  display: inline-block;
  width: calc(2.2em * var(--scale));
  height: calc(1.1em * var(--scale));
  vertical-align: middle;
}

input {
  visibility: hidden;
  &:disabled + .slider {
    background-color: var(--background-color-secondary);
  }
  &:checked {
    & + .slider {
      background-color: var(--color-extra-blue-base);
      &:before {
        transform: translateX(calc(1.1em * var(--scale)));
      }
    }
    &:disabled + .slider {
      background-color: var(--color-extra-blue-l40);
    }
  }
  &:focus + .slider {
    box-shadow: var(--shadow-100);
  }
}

.slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: pointer;
  transition: 0.2s;
  border-radius: calc(1.1em * var(--scale));
  background-color: var(--color-grayscale-400);
  &:before {
    position: absolute;
    content: "";
    height: calc(0.77em * var(--scale));
    width: calc(0.77em * var(--scale));
    left: calc(0.165em * var(--scale));
    bottom: calc(0.165em * var(--scale));
    background-color: var(--color-grayscale-500);
    transition: 0.2s;
    border-radius: 50%;
    box-shadow: var(--shadow-300);
  }
}
</style>
