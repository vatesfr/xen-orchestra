<template>
<<<<<<< HEAD
  <label class="form-widget">
=======
  <label :class="{ inline }" class="form-widget">
>>>>>>> feat(lite): initial Vue.js implementation
    <span v-if="label || $slots.label" class="label">
      <slot name="label">
        {{ label }}
      </slot>
    </span>
    <span class="widget">
      <span v-if="before || $slots.before" class="before">
        <slot name="before">
          <FontAwesomeIcon v-if="isIcon(before)" :icon="before" fixed-width />
          <template v-else>{{ before }}</template>
        </slot>
      </span>
      <span class="element">
        <slot />
      </span>
      <span v-if="after || $slots.after" class="after">
        <slot name="after">
          <FontAwesomeIcon v-if="isIcon(after)" :icon="after" fixed-width />
          <template v-else>{{ after }}</template>
        </slot>
      </span>
    </span>
  </label>
</template>

<script lang="ts" setup>
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";

defineProps<{
<<<<<<< HEAD
  before?: IconDefinition | string | object; // "object" added as workaround
  after?: IconDefinition | string | object; // See https://github.com/vuejs/core/issues/4294
=======
  before?: IconDefinition | string;
  after?: IconDefinition | string;
>>>>>>> feat(lite): initial Vue.js implementation
  label?: string;
  inline?: boolean;
}>();

const isIcon = (maybeIcon: any): maybeIcon is IconDefinition =>
  typeof maybeIcon === "object";
</script>

<<<<<<< HEAD
<style lang="postcss" scoped>
=======
<style scoped>
>>>>>>> feat(lite): initial Vue.js implementation
.form-widget {
  display: inline-flex;
  align-items: stretch;
  gap: 1rem;
  font-size: 1.6rem;
  height: 3.8rem;
}

.widget {
  display: inline-flex;
<<<<<<< HEAD
  flex: 1;
=======
>>>>>>> feat(lite): initial Vue.js implementation
  align-items: stretch;
  overflow: hidden;
  padding: 0 0.7rem;
  border: 1px solid var(--color-blue-scale-400);
  border-radius: 0.8rem;
<<<<<<< HEAD
  background-color: var(--color-blue-scale-500);
=======
  background-color: var(--form-background);
>>>>>>> feat(lite): initial Vue.js implementation
  box-shadow: var(--shadow-100);
  gap: 0.1rem;

  &:focus-within {
    outline: 1px solid var(--color-extra-blue-l40);
  }
}

<<<<<<< HEAD
.label {
  display: flex;
  align-items: center;
}

=======
>>>>>>> feat(lite): initial Vue.js implementation
.form-widget:hover .widget {
  border-color: var(--color-extra-blue-l60);
}

.element {
  display: flex;
<<<<<<< HEAD
  flex: 1;
  align-items: center;
=======
>>>>>>> feat(lite): initial Vue.js implementation
}

.before,
.after {
  display: flex;
  align-items: center;
<<<<<<< HEAD
  padding: 0 0.3rem;
=======
>>>>>>> feat(lite): initial Vue.js implementation
}

:slotted(input),
:slotted(select),
:slotted(textarea) {
<<<<<<< HEAD
=======
  font-family: Poppins, sans-serif;
>>>>>>> feat(lite): initial Vue.js implementation
  font-size: inherit;
  border: none;
  outline: none;
  color: var(--color-blue-scale-100);
<<<<<<< HEAD
  background-color: var(--color-blue-scale-500);
  flex: 1;

  &:disabled {
    opacity: 0.5;
  }
=======
  background-color: var(--form-background);
>>>>>>> feat(lite): initial Vue.js implementation
}

:slotted(input[type="checkbox"]) {
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
    content: "";
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
<<<<<<< HEAD
    color: var(--color-blue-scale-200);
=======
    color: var(--form-control-disabled);
    --form-control-color: var(--form-control-disabled);
>>>>>>> feat(lite): initial Vue.js implementation
  }
}
</style>
