<!-- v5 -->
<template>
  <component
    :is="component"
    class="ui-menu-item typo-body-bold-small"
    :class="className"
    v-bind="attributes"
    :type="isButton ? 'button' : undefined"
    :disabled="isButton ? disabled : undefined"
  >
    <VtsIcon :name="icon" size="medium" />
    <slot />
    <span v-if="info" class="info typo-body-regular-small em-dash-prefix">{{ info }}</span>
    <UiCounter v-if="counter !== undefined" :value="counter" accent="info" size="small" variant="primary" />
    <VtsIcon v-if="submenu" name="fa:angle-right" size="medium" />
    <VtsIcon v-if="attributes.target === '_blank'" name="action:open-in-new-tab" size="medium" />
  </component>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { type LinkOptions, useLinkComponent } from '@core/composables/link-component.composable.ts'
import type { IconName } from '@core/icons'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

export type MenuItemSize = 'small' | 'large'

const props = defineProps<
  LinkOptions & {
    size: MenuItemSize
    selected?: boolean
    icon?: IconName
    info?: string
    counter?: number
    submenu?: boolean
  }
>()

defineSlots<{
  default(): any
}>()

const { component, attributes } = useLinkComponent('button', () => props)

const isButton = computed(() => component.value === 'button')

const className = computed(() => toVariants({ size: props.size, selected: props.selected, disabled: props.disabled }))
</script>

<style lang="postcss" scoped>
.ui-menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-inline: 1.6rem;
  border: none;
  text-align: start;
  text-decoration: none;
  color: var(--color-brand-txt-base);
  background-color: var(--color-neutral-background-primary);
  cursor: pointer;

  .info {
    color: var(--color-neutral-txt-secondary);
  }

  &:not(.disabled) {
    &:hover {
      color: var(--color-brand-txt-hover);
      background-color: var(--color-brand-background-hover);
    }

    &:active {
      color: var(--color-brand-txt-active);
      background-color: var(--color-brand-background-active);
    }
  }

  &:focus-visible {
    outline: none;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border: 0.2rem solid var(--color-brand-txt-base);
      border-radius: 0.4rem;
    }
  }

  &.selected {
    color: var(--color-brand-txt-base);
    background-color: var(--color-brand-background-selected);
  }

  &.disabled {
    color: var(--color-neutral-txt-secondary);
    background-color: var(--color-neutral-background-disabled);
    cursor: not-allowed;
  }

  /* SIZE */

  &.size--small {
    padding-block: 1.6rem;
    border-block: 0.1rem solid var(--color-neutral-border);

    & + .size--small {
      border-block-start-width: 0;
    }
  }

  &.size--large {
    padding-block: 1.2rem;
  }
}
</style>
