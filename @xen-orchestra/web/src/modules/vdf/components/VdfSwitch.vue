<template>
  <label class="vdf-switch typo-body-regular-small" :class="{ disabled }">
    <input v-model="checked" :disabled class="input" type="checkbox" role="switch" />
    <span class="track" aria-hidden="true">
      <span class="knob" />
    </span>
    <slot />
  </label>
</template>

<script lang="ts" setup>
// An on/off switch: the knob inside its track, the label after it in
// sentence case. XO's UiToggle draws its knob larger than the track, which
// reads less clearly as a switch
const { disabled = false } = defineProps<{
  disabled?: boolean
}>()

const checked = defineModel<boolean>({ default: false })

defineSlots<{
  default(): any
}>()
</script>

<style lang="postcss" scoped>
.vdf-switch {
  --transition: 0.2s ease-in-out;

  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  color: var(--color-neutral-txt-primary);
  cursor: pointer;
  user-select: none;

  .input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .track {
    position: relative;
    flex-shrink: 0;
    width: 3.6rem;
    height: 2rem;
    border-radius: 1rem;
    background-color: var(--color-neutral-border);
    transition: background-color var(--transition);
  }

  .knob {
    position: absolute;
    inset-block-start: 0.2rem;
    inset-inline-start: 0.2rem;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    background-color: var(--color-neutral-background-primary);
    box-shadow: 0 0.1rem 0.2rem rgb(0 0 0 / 20%);
    transition: transform var(--transition);
  }

  &:not(.disabled):hover .track {
    background-color: var(--color-neutral-txt-secondary);
  }

  .input:checked + .track {
    background-color: var(--color-brand-item-base);

    .knob {
      transform: translateX(1.6rem);
    }
  }

  &:not(.disabled):hover .input:checked + .track {
    background-color: var(--color-brand-item-hover);
  }

  .input:focus-visible + .track {
    outline: 0.2rem solid var(--color-brand-txt-base);
    outline-offset: 0.2rem;
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media (prefers-reduced-motion: reduce) {
    --transition: 0s;
  }
}
</style>
