<template>
  <label class="form-widget">
    <span v-if="label || slots.label" class="label">
      <slot name="label">
        {{ label }}
      </slot>
    </span>
    <span class="widget">
      <span v-if="before || slots.before" class="before">
        <slot name="before">
          <UiIcon v-if="isIcon(before)" :icon="before" fixed-width />
          <template v-else>{{ before }}</template>
        </slot>
      </span>
      <span class="element">
        <slot />
      </span>
      <span v-if="after || slots.after" class="after">
        <slot name="after">
          <UiIcon v-if="isIcon(after)" :icon="after" fixed-width />
          <template v-else>{{ after }}</template>
        </slot>
      </span>
    </span>
  </label>
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

defineProps<{
  before?: IconDefinition | string | object // "object" added as workaround
  after?: IconDefinition | string | object // See https://github.com/vuejs/core/issues/4294
  label?: string
  inline?: boolean
}>()

const slots = defineSlots<{
  default(): any
  label?(): any
  before?(): any
  after?(): any
}>()

const isIcon = (maybeIcon: any): maybeIcon is IconDefinition => typeof maybeIcon === 'object'
</script>

<style lang="postcss" scoped>
.form-widget {
  display: inline-flex;
  align-items: stretch;
  gap: 1rem;
  font-size: 1.6rem;
  height: 3.8rem;
}

.widget {
  display: inline-flex;
  flex: 1;
  align-items: stretch;
  overflow: hidden;
  padding: 0 0.7rem;
  border: 1px solid var(--color-neutral-border);
  border-radius: 0.8rem;
  background-color: var(--color-neutral-background-primary);
  box-shadow: var(--shadow-100);
  gap: 0.1rem;

  &:focus-within {
    outline: 1px solid var(--color-brand-item-active);
  }
}

.label {
  display: flex;
  align-items: center;
}

.form-widget:hover .widget {
  border-color: var(--color-brand-item-hover);
}

.element {
  display: flex;
  flex: 1;
  align-items: center;
}

.before,
.after {
  display: flex;
  align-items: center;
  padding: 0 0.3rem;
}

:slotted(input),
:slotted(select),
:slotted(textarea) {
  font-size: inherit;
  border: none;
  outline: none;
  color: var(--color-neutral-txt-primary);
  background-color: var(--color-neutral-background-primary);
  flex: 1;

  &:disabled {
    opacity: 0.5;
  }
}

:slotted(input[type='checkbox']) {
  font: inherit;
  display: grid;
  flex: 1.5rem 0 0;
  width: 1.15em;
  height: 1.15em;
  margin: 0;
  padding: 0;
  transform: translateY(-0.075em);
  color: currentColor;
  border-radius: 0.15em;
  background-color: #fff;
  appearance: none;
  place-content: center;

  &::before {
    width: 0.65em;
    height: 0.65em;
    content: '';
    transition: 120ms transform ease-in-out;
    transform: scale(0);
    transform-origin: center;
    box-shadow: inset 1em 1em blue;
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
  }

  &:checked::before {
    transform: scale(1.4);
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
