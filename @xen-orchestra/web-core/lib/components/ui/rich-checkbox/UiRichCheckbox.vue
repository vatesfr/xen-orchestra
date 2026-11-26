<!-- v1 -->
<template>
  <div :class="className" class="ui-rich-checkbox">
    <label class="box typo-body-bold">
      <span class="controls">
        <span class="checkbox">
          <input
            v-model="model"
            :aria-labelledby="headingId"
            :aria-describedby="hasDescription ? descriptionId : undefined"
            :disabled="isDisabled"
            :indeterminate="isIndeterminate"
            :value
            class="input"
            type="checkbox"
          />
          <VtsIcon :name="checkboxIcon" size="medium" />
        </span>
        <VtsIcon v-if="icon" :name="icon" size="medium" />
      </span>
      <span class="content">
        <span :id="headingId" class="heading">
          <span class="label">
            <slot />
          </span>
          <slot v-if="slots.tag || tag !== undefined" name="tag">
            <UiTag accent="info" variant="secondary">{{ tag }}</UiTag>
          </slot>
        </span>
        <span v-if="hasDescription" :id="descriptionId" class="description typo-body-regular">
          <slot name="description">{{ description }}</slot>
        </span>
      </span>
    </label>
    <slot v-if="slots.info || info !== undefined" name="info">
      <UiInfo accent="info">{{ info }}</UiInfo>
    </slot>
    <slot v-if="accent !== 'brand' && (slots.message || message !== undefined)" name="message">
      <UiInfo :accent>{{ message }}</UiInfo>
    </slot>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { type CheckboxModel, useCheckboxState } from '@core/composables/checkbox-state.composable.ts'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import type { IconName } from '@core/icons'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed, useId } from 'vue'

export type RichCheckboxAccent = 'brand' | 'warning' | 'danger'

const { accent, value, description, disabled } = defineProps<{
  accent: RichCheckboxAccent
  value?: string
  icon?: IconName
  tag?: string
  description?: string
  info?: string
  message?: string
  disabled?: boolean
}>()

const model = defineModel<CheckboxModel>({ default: undefined })

const slots = defineSlots<{
  default(): any
  tag?(): any
  description?(): any
  info?(): any
  message?(): any
}>()

const headingId = useId()

const descriptionId = useId()

const hasDescription = computed(() => slots.description !== undefined || description !== undefined)

const isDisabled = useDisabled(() => disabled)

const { isIndeterminate, isChecked, icon: checkboxIcon } = useCheckboxState(model, () => value)

const className = computed(() =>
  toVariants({
    accent,
    checked: isChecked.value,
    indeterminate: isIndeterminate.value,
    disabled: isDisabled.value,
  })
)
</script>

<style lang="postcss" scoped>
.ui-rich-checkbox {
  --box-border-color: var(--accent-color);
  --box-background-color: var(--color-neutral-background-primary);
  --border-hover-color: var(--accent-hover-color);
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
    color: var(--color-neutral-txt-primary);
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
    height: 1lh;
  }

  .checkbox {
    position: relative;
    display: inline-flex;
    color: var(--checkbox-color);
    transition: color 0.125s ease-in-out;

    .input {
      opacity: 0;
      position: absolute;
      pointer-events: none;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.2rem;
    min-width: 0;
    overflow-wrap: break-word;
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
  }

  .description {
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
    --border-hover-color: var(--color-danger-txt-base);
    --accent-color: var(--color-danger-txt-base);
    --accent-hover-color: var(--color-danger-txt-hover);
    --accent-active-color: var(--color-danger-txt-active);
    --background-checked-color: var(--color-danger-background-selected);
    --background-hover-color: var(--color-danger-background-hover);
    --background-active-color: var(--color-danger-background-active);
    --background-checked-active-color: var(--color-danger-background-active);
  }

  /* INTERACTIONS */

  &:not(.disabled) {
    &:is(.checked, .indeterminate) .box {
      --box-border-color: var(--accent-color);
      --box-background-color: var(--background-checked-color);
    }

    &.checked .box {
      --background-active-color: var(--background-checked-active-color);
    }

    .box {
      --checkbox-color: var(--accent-color);
      --checkbox-mark-color: var(--box-background-color);

      &:hover {
        --checkbox-color: var(--accent-hover-color);
        --checkbox-mark-color: var(--background-hover-color);
        border-color: var(--border-hover-color);
        background-color: var(--background-hover-color);
      }

      &:active {
        --checkbox-color: var(--accent-active-color);
        --checkbox-mark-color: var(--background-active-color);
        border-color: var(--accent-active-color);
        background-color: var(--background-active-color);
      }
    }
  }

  /* DISABLED */

  &.disabled .box {
    --checkbox-color: var(--color-neutral-txt-secondary);
    --checkbox-mark-color: var(--color-neutral-background-disabled);
    border-color: var(--color-neutral-border);
    background-color: var(--color-neutral-background-disabled);
    color: var(--color-neutral-txt-secondary);
    cursor: not-allowed;
  }
}
</style>
