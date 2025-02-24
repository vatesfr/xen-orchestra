<!-- v3 -->
<template>
  <component :is="component" :class="classes" class="ui-link" v-bind="attributes">
    <VtsIcon :icon accent="current" />
    <slot />
    <VtsIcon v-if="attributes.target === '_blank'" :icon="faUpRightFromSquare" accent="current" class="external-icon" />
  </component>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { type LinkOptions, useLinkComponent } from '@core/composables/link-component.composable'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<
  LinkOptions & {
    size: 'small' | 'medium'
    icon?: IconDefinition
  }
>()

const typoClasses = {
  small: 'typo p3-regular-underline',
  medium: 'typo p1-regular-underline',
}

const { component, attributes, isDisabled } = useLinkComponent('span', () => props)

const classes = computed(() => [typoClasses[props.size], { disabled: isDisabled.value }])
</script>

<style lang="postcss" scoped>
.ui-link {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  color: var(--color-brand-txt-base);

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

  .external-icon {
    font-size: 0.75em;
  }
}
</style>
