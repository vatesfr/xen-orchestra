<!-- v7 -->
<template>
  <div class="ui-accordion-item" :class="className">
    <button
      :id="`header-${identifier}`"
      type="button"
      class="header"
      :class="fontClass"
      :aria-expanded="isExpanded"
      :aria-controls="`panel-${identifier}`"
      @click="toggle()"
    >
      {{ title }}
      <VtsIcon :name="isExpanded ? 'fa:angle-up' : 'fa:angle-down'" :size="iconSize" />
    </button>
    <div class="divider-wrapper" :class="{ visible: isExpanded || size === 'small' }">
      <div class="divider-inner">
        <VtsDivider type="stretch" />
      </div>
    </div>
    <div class="panel-wrapper" :class="{ expanded: isExpanded }">
      <div :id="`panel-${identifier}`" role="region" :aria-labelledby="`header-${identifier}`" class="panel-inner">
        <slot name="content">
          {{ content }}
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsIcon, { type IconSize } from '@core/components/icon/VtsIcon.vue'
import { useMapper } from '@core/packages/mapper'
import { IK_ACCORDION } from '@core/utils/injection-keys.util.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed, inject, ref } from 'vue'

const { size, disabled, identifier } = defineProps<{
  size: 'small' | 'large'
  title: string
  identifier: string | number
  content?: string
  disabled?: boolean
}>()

defineSlots<{
  content?(): any
}>()

const accordion = inject(IK_ACCORDION)

const localExpanded = ref(false)

const isExpanded = computed(() => {
  if (accordion) {
    return accordion.expandedKey === String(identifier)
  }
  return localExpanded.value
})

const toggle = () => {
  if (disabled) {
    return
  }

  if (accordion) {
    accordion.toggle(String(identifier))
  } else {
    localExpanded.value = !localExpanded.value
  }
}

const fontClass = useMapper(
  () => size,
  {
    small: 'typo-body-bold-small',
    large: 'typo-body-bold',
  },
  'large'
)

const className = computed(() =>
  toVariants({
    size,
    muted: disabled ?? false,
    expanded: isExpanded.value,
  })
)

const iconSize = computed<IconSize>(() => (size === 'small' ? 'medium' : 'large'))
</script>

<style scoped lang="postcss">
.ui-accordion-item {
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    justify-content: space-between;
    gap: 1.6rem;
    color: var(--color-brand-txt-base);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: scale(1.05, 2.2);
    }

    &:focus {
      outline: none;
    }
  }

  &:has(.header:focus-visible) {
    outline: 0.2rem solid var(--color-brand-txt-base);
    border-radius: 0.4rem;
    outline-offset: 0.2rem;
  }

  /* HEADER VARIANT */
  &.muted .header {
    cursor: default;
    color: var(--color-neutral-txt-secondary);
  }

  &:not(.muted) .header {
    &:hover {
      color: var(--color-brand-txt-hover);
    }

    &:active {
      color: var(--color-brand-txt-active);
    }
  }

  /* SIZE VARIANT */
  &.size--small {
    padding: 0;

    .header {
      margin-bottom: 0.4rem;
    }
  }

  &.size--large {
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.4rem;
    padding: 1.6rem;

    .header:has(+ .divider-wrapper.visible) {
      margin-bottom: 1.2rem;
    }
  }

  /* ANIMATION DIVIDER */
  .divider-wrapper {
    display: grid;
    grid-template-rows: 0fr;
    overflow: hidden;
    transition: grid-template-rows 0.3s ease;

    .divider-inner {
      min-height: 0;
      overflow: hidden;
    }

    &.visible {
      grid-template-rows: 1fr;

      + .panel-wrapper {
        margin-top: 1.2rem;
      }
    }
  }

  /* ANIMATION PANEL */
  .panel-wrapper {
    display: grid;
    grid-template-rows: 0fr;
    overflow: hidden;
    transition: grid-template-rows 0.3s ease;

    .panel-inner {
      min-height: 0;
      overflow: hidden;
    }

    &.expanded {
      grid-template-rows: 1fr;
    }
  }
}
</style>
