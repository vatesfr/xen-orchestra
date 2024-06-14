<!-- WIP -->
<template>
  <div class="ui-input">
    <UiIcon class="before" :icon="beforeIcon" />
    <input
      :id="uniqueId('input-')"
      v-model="model"
      :class="{ 'has-after': !disabled && hasModel }"
      type="search"
      :disabled
      v-bind="$attrs"
      class="typo p1-regular"
    />
    <UiIcon v-if="!disabled && hasModel" class="after" :icon="faXmark" @click="model = ''" />
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import { uniqueId } from '@core/utils/unique-id.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

defineProps<{
  disabled?: boolean
  beforeIcon?: IconDefinition
}>()

const model = defineModel<string>()

const hasModel = computed(() => model.value !== undefined && model.value.trim() !== '')
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
input {
  & {
    --border-color: var(--color-grey-500);
    --background-color: var(--background-color-primary);
  }

  &:is(:hover, .hover, :focus-visible) {
    --border-color: var(--color-purple-d20);
    --background-color: var(--background-color-primary);
  }

  &:is(:focus, .active) {
    --border-color: var(--color-purple-base);
    --background-color: var(--background-color-primary);
  }

  &:is(:active, .pressed) {
    --border-color: var(--color-purple-d40);
    --background-color: var(--background-color-primary);
  }

  &:is(:disabled, .disabled) {
    --border-color: var(--color-grey-500);
    --background-color: var(--background-color-secondary);
  }
}

/* BORDER VARIANTS */
input {
  --border-width: 0.1rem;

  &:is(:hover, .hover, :focus-visible) {
    --border-width: 0.1rem;
  }

  &:is(:focus, .active) {
    --border-width: 0.2rem;
  }

  &:is(:active, .pressed) {
    --border-width: 0.1rem;
  }

  &:is(:disabled, .disabled) {
    --border-width: 0.1rem;
  }
}

/* IMPLEMENTATION */
input {
  border: var(--border-width) solid var(--border-color);
  border-radius: 0.8rem;
  outline: none;
  width: 100%;
  height: 4rem;
  padding: 0.8rem 1.6rem 0.8rem 4.8rem;
  color: var(--color-grey-000);
  background-color: var(--background-color);

  &.has-after {
    padding-inline-end: 4.8rem;
  }

  &:is(:disabled, .disabled) {
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--color-grey-300);
  }

  &[type='search']::-webkit-search-cancel-button {
    display: none;
  }
}

.ui-input {
  position: relative;
}

.before,
.after {
  position: absolute;
  inset-block: 1.2rem;
  color: var(--color-grey-400);
}

.before {
  inset-inline-start: 1.6rem;
  pointer-events: none;
  z-index: 1;
}

.after {
  inset-inline-end: 1.6rem;
  cursor: pointer;
}
</style>
