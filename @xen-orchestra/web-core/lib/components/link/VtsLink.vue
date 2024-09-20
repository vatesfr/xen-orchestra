<template>
  <component :is="component" :class="classes" class="vts-link" v-bind="attributes">
    <UiIcon :icon="icon" color="current" />
    <slot />
    <UiIcon
      v-if="attributes.target === '_blank'"
      :icon="faArrowUpRightFromSquare"
      class="external-icon"
      color="current"
    />
  </component>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import { useLinkComponent } from '@core/composables/link-component.composable'
import { toVariants } from '@core/utils/to-variants.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  size: 'small' | 'medium'
  accent: 'brand' | 'success' | 'warning' | 'danger'
  icon?: IconDefinition
  disabled?: boolean
  href?: string
  to?: RouteLocationRaw
  target?: '_blank' | '_self'
}>()

const typoClasses = {
  small: 'typo p3-regular',
  medium: 'typo p1-regular',
}

const { component, attributes, isDisabled } = useLinkComponent('span', () => props)

const classes = computed(() => [
  typoClasses[props.size],
  toVariants({
    disabled: isDisabled.value,
    accent: props.accent,
  }),
])
</script>

<style lang="postcss" scoped>
/*
ACCENT + STATE
--vts-link--color
*/
.vts-link {
  &.accent--brand {
    --vts-link--color: var(--color-normal-txt-base);

    &:hover {
      --vts-link--color: var(--color-normal-txt-hover);
    }

    &:active {
      --vts-link--color: var(--color-normal-txt-active);
    }

    &.disabled {
      --vts-link--color: var(--color-neutral-txt-secondary);
    }
  }

  &.accent--success {
    --vts-link--color: var(--color-success-txt-base);

    &:hover {
      --vts-link--color: var(--color-success-txt-hover);
    }

    &:active {
      --vts-link--color: var(--color-success-txt-active);
    }

    &.disabled {
      --vts-link--color: var(--color-neutral-txt-secondary);
    }
  }

  &.accent--warning {
    --vts-link--color: var(--color-warning-txt-base);

    &:hover {
      --vts-link--color: var(--color-warning-txt-hover);
    }

    &:active {
      --vts-link--color: var(--color-warning-txt-active);
    }

    &.disabled {
      --vts-link--color: var(--color-neutral-txt-secondary);
    }
  }

  &.accent--danger {
    --vts-link--color: var(--color-danger-txt-base);

    &:hover {
      --vts-link--color: var(--color-danger-txt-hover);
    }

    &:active {
      --vts-link--color: var(--color-danger-txt-active);
    }

    &.disabled {
      --vts-link--color: var(--color-neutral-txt-secondary);
    }
  }
}

/* IMPLEMENTATION */
.vts-link {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  color: var(--vts-link--color);
  text-decoration: underline;
  text-underline-offset: 0.2rem;

  &.disabled {
    cursor: not-allowed;
  }

  .external-icon {
    font-size: 0.75em;
  }
}
</style>
