<!-- v1 -->
<template>
  <div :class="className" class="ui-rich-radio-button">
    <label class="box">
      <span class="controls">
        <span class="radio">
          <input
            v-model="model"
            :aria-labelledby="headingId"
            :aria-describedby="slots.description || description !== undefined ? descriptionId : undefined"
            :disabled="isDisabled"
            :value
            class="input"
            type="radio"
          />
          <VtsIcon name="status:radio-button" size="medium" />
        </span>
        <VtsIcon v-if="icon" :name="icon" size="medium" class="icon" />
      </span>
      <span class="content">
        <span :id="headingId" class="heading">
          <span class="label typo-body-bold">
            <slot />
          </span>
          <slot v-if="slots.tag || tag !== undefined" name="tag">
            <UiTag accent="info" variant="secondary">{{ tag }}</UiTag>
          </slot>
        </span>
        <span
          v-if="slots.description || description !== undefined"
          :id="descriptionId"
          class="description typo-body-regular"
        >
          <slot name="description">{{ description }}</slot>
        </span>
      </span>
    </label>
    <slot v-if="slots.info || info !== undefined" name="info">
      <UiInfo accent="info">{{ info }}</UiInfo>
    </slot>
  </div>
</template>

<script lang="ts" setup generic="TValue">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import type { IconName } from '@core/icons'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed, useId } from 'vue'

export type RichRadioButtonAccent = 'brand' | 'warning' | 'danger'

const { accent, disabled } = defineProps<{
  accent: RichRadioButtonAccent
  value: TValue
  icon?: IconName
  tag?: string
  description?: string
  info?: string
  disabled?: boolean
}>()

const model = defineModel<TValue>()

const slots = defineSlots<{
  default(): any
  tag?(): any
  description?(): any
  info?(): any
}>()

const headingId = useId()

const descriptionId = useId()

const isDisabled = useDisabled(() => disabled)

const className = computed(() => toVariants({ accent, disabled: isDisabled.value }))
</script>

<style lang="postcss" scoped>
.ui-rich-radio-button {
  --radio-dot-color: var(--color-neutral-background-primary);
  --box-border-color: var(--accent-color);
  --box-background-color: var(--color-neutral-background-primary);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .box {
    position: relative;
    display: flex;
    flex-grow: 1;
    align-items: flex-start;
    gap: 1.2rem;
    padding: 1.2rem 1.6rem;
    border: 0.1rem solid var(--box-border-color);
    border-radius: 0.4rem;
    background-color: var(--box-background-color);
    cursor: pointer;
    transition:
      border-color 0.125s ease-in-out,
      background-color 0.125s ease-in-out;

    &:has(.input:focus-visible)::before {
      content: '';
      position: absolute;
      inset: -0.4rem;
      border: 0.2rem solid var(--color-brand-txt-base);
      border-radius: 0.4rem;
    }
  }

  .controls {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 1.2rem;
    height: 2.4rem;
  }

  .radio {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    border-radius: 50%;
    color: var(--radio-color);
    transition:
      color 0.125s ease-in-out,
      background-color 0.125s ease-in-out;

    &:has(.input:checked) {
      background-color: var(--radio-color);

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        width: 0.6rem;
        height: 0.6rem;
        margin: auto;
        border-radius: 50%;
        background-color: var(--radio-dot-color);
      }
    }

    .input {
      opacity: 0;
      position: absolute;
      pointer-events: none;
    }
  }

  .icon {
    color: var(--color-neutral-txt-primary);
  }

  .content {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.2rem;
    min-width: 0;
  }

  .heading {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.8rem;
  }

  .label {
    flex: auto;
    min-width: 0;
    overflow-wrap: break-word;
    color: var(--color-neutral-txt-primary);
  }

  .description {
    overflow-wrap: break-word;
    color: var(--color-neutral-txt-secondary);
  }

  /* ACCENT */

  &.accent--brand {
    --box-border-color: var(--color-neutral-txt-secondary);
    --accent-color: var(--color-brand-txt-base);
    --accent-hover-color: var(--color-brand-txt-hover);
    --accent-active-color: var(--color-brand-txt-active);
    --background-checked-color: var(--color-brand-background-selected);
    --background-hover-color: var(--color-brand-background-hover);
    --background-active-color: var(--color-brand-background-active);
    --background-checked-active-color: var(--color-brand-background-hover);
  }

  &.accent--warning {
    --accent-color: var(--color-warning-txt-base);
    --accent-hover-color: var(--color-warning-txt-hover);
    --accent-active-color: var(--color-warning-txt-active);
    --background-checked-color: var(--color-warning-background-selected);
    --background-hover-color: var(--color-warning-background-hover);
    --background-active-color: var(--color-warning-background-hover);
    --background-checked-active-color: var(--color-warning-background-hover);
  }

  &.accent--danger {
    --accent-color: var(--color-danger-txt-base);
    --accent-hover-color: var(--color-danger-txt-hover);
    --accent-active-color: var(--color-danger-txt-active);
    --background-checked-color: var(--color-danger-background-selected);
    --background-hover-color: var(--color-danger-background-hover);
    --background-active-color: var(--color-danger-background-active);
    --background-checked-active-color: var(--color-danger-background-active);
  }

  /* INTERACTIONS */

  &:not(.disabled) .box {
    --radio-color: var(--accent-color);

    &:has(.input:checked) {
      --box-border-color: var(--accent-color);
      --box-background-color: var(--background-checked-color);
      --background-active-color: var(--background-checked-active-color);
    }

    &:hover {
      --radio-color: var(--accent-hover-color);
      border-color: var(--color-brand-txt-hover);
      background-color: var(--background-hover-color);
    }

    &:active {
      --radio-color: var(--accent-active-color);
      border-color: var(--color-brand-txt-active);
      background-color: var(--background-active-color);
    }
  }

  /* DISABLED */

  &.disabled .box {
    --radio-color: var(--color-neutral-txt-secondary);
    --radio-dot-color: var(--color-neutral-background-disabled);
    border-color: var(--color-neutral-border);
    background-color: var(--color-neutral-background-disabled);
    cursor: not-allowed;

    .label,
    .icon {
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
