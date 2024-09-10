<!-- WIP -->
<template>
  <div class="ui-input">
    <UiIcon :icon class="before" />
    <input :id v-model.trim="modelValue" class="typo p1-regular input" type="search" v-bind="$attrs" />
    <UiIcon v-if="!$attrs.disabled && modelValue" :icon="faXmark" class="after" color="info" @click="modelValue = ''" />
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import { uniqueId } from '@core/utils/unique-id.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

defineOptions({
  inheritAttrs: false,
})

defineProps<{
  icon?: IconDefinition
}>()

const modelValue = defineModel<string>({ required: true })

const id = computed(() => uniqueId('input-'))
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */
.input {
  & {
    --border-color: var(--color-neutral-border);
    --background-color: var(--color-neutral-background-primary);
  }

  &:is(:hover, :focus-visible) {
    --border-color: var(--color-normal-txt-hover);
    --background-color: var(--color-neutral-background-primary);
  }

  &:focus {
    --border-color: var(--color-normal-txt-base);
    --background-color: var(--color-neutral-background-primary);
  }

  &:active {
    --border-color: var(--color-normal-txt-active);
    --background-color: var(--color-neutral-background-primary);
  }

  &:disabled {
    --border-color: var(--color-neutral-border);
    --background-color: var(--color-neutral-background-secondary);
  }
}

/* BORDER VARIANTS */
.input {
  --border-width: 0.1rem;

  &:is(:hover, :focus-visible) {
    --border-width: 0.1rem;
  }

  &:focus {
    --border-width: 0.2rem;
  }

  &:active {
    --border-width: 0.1rem;
  }

  &:disabled {
    --border-width: 0.1rem;
  }
}

/* IMPLEMENTATION */
.ui-input {
  position: relative;

  .before + .input {
    padding-inline-start: 4.8rem;
  }
}

.input {
  border: var(--border-width) solid var(--border-color);
  border-radius: 0.8rem;
  outline: none;
  width: 100%;
  height: 4rem;
  padding: 0.8rem 1.6rem;
  color: var(--color-neutral-txt-primary);
  background-color: var(--background-color);

  &:has(+ .after) {
    padding-inline-end: 4.8rem;
  }

  &:disabled {
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--color-neutral-txt-secondary);
  }

  &[type='search']::-webkit-search-cancel-button {
    display: none;
  }
}

.before,
.after {
  position: absolute;
  inset-block: 1.2rem;
}

.before {
  color: var(--color-neutral-txt-secondary);
  inset-inline-start: 1.6rem;
  pointer-events: none;
  z-index: 1;
}

.after {
  inset-inline-end: 1.6rem;
  cursor: pointer;
}
</style>
