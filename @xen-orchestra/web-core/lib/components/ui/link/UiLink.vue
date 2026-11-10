<!-- v6 -->
<template>
  <component :is="component" :class="classes" class="ui-link" v-bind="attributes">
    <span v-if="icon || busy" class="icon-container">
      <VtsIcon :name="icon" :tooltip="iconTooltip" :busy :busy-tooltip size="medium" />
    </span>
    <slot />
    <span v-if="attributes.target === '_blank'" class="icon-container">
      <VtsIcon name="action:open-in-new-tab" size="medium" class="external-icon" />
    </span>
    <span v-if="isPrimary" class="icon-container">
      <VtsIcon v-tooltip="primaryTooltip" name="status:primary-circle" size="medium" />
    </span>
  </component>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { type LinkOptions, useLinkComponent } from '@core/composables/link-component.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { computed } from 'vue'

const props = defineProps<
  LinkOptions & {
    size: 'small' | 'medium'
    icon?: IconName
    iconTooltip?: string
    busy?: boolean
    busyTooltip?: string
    isPrimary?: boolean
    primaryTooltip?: string
    displayInline?: boolean
  }
>()

const typoClasses = {
  small: 'typo-action-link-small',
  medium: 'typo-action-link',
}

const { component, attributes, isDisabled } = useLinkComponent('span', () => props)

const classes = computed(() => [typoClasses[props.size], { disabled: isDisabled.value, inline: props.displayInline }])
</script>

<style lang="postcss" scoped>
.ui-link {
  display: inline-flex;
  align-items: baseline;
  gap: 0.8rem;
  color: var(--color-brand-txt-base);

  &.inline {
    display: inline;
  }

  &:hover {
    color: var(--color-brand-txt-hover);
  }

  &:active {
    color: var(--color-brand-txt-active);
  }

  &:focus-visible {
    outline: none;

    &::before {
      content: '';
      position: absolute;
      inset: -0.4rem;
      border: 0.2rem solid var(--color-brand-txt-base);
      border-radius: 0.4rem;
    }
  }

  &.disabled {
    color: var(--color-neutral-txt-secondary);
    cursor: not-allowed;
  }

  &:not([href]) {
    text-decoration: none;
    cursor: default;
  }

  .icon-container {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    height: 1lh;
    flex-shrink: 0;
  }

  .external-icon {
    font-size: 0.75em;
  }
}
</style>
