<!-- v7 -->
<template>
  <component :is="controller.titleTag" class="ui-accordion-item-title" :class="className">
    <button
      :id="`${item.id}-title`"
      type="button"
      class="trigger"
      :class="fontClass"
      :aria-expanded="item.isExpanded"
      :aria-controls="`${item.id}-content`"
      :disabled="item.isDisabled"
      @click="item.toggle()"
    >
      <span>
        <slot />
      </span>
      <VtsIcon :name="item.isExpanded ? 'fa:angle-up' : 'fa:angle-down'" :size="iconSize" />
    </button>
  </component>
</template>

<script lang="ts" setup>
import VtsIcon, { type IconSize } from '@core/components/icon/VtsIcon.vue'
import type { AccordionSize } from '@core/components/ui/accordion/UiAccordion.vue'
import { useMapper } from '@core/packages/mapper'
import { injectStrict } from '@core/utils/inject-strict.util.ts'
import { IK_ACCORDION_CONTROLLER, IK_ACCORDION_ITEM } from '@core/utils/injection-keys.util.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

defineSlots<{
  default(): any
}>()

const controller = injectStrict(IK_ACCORDION_CONTROLLER, 'UiAccordionItemTitle must be used inside UiAccordion')

const item = injectStrict(IK_ACCORDION_ITEM, 'UiAccordionItemTitle must be used inside UiAccordionItem')

const fontClass = useMapper(
  () => controller.size,
  {
    small: 'typo-body-bold-small',
    large: 'typo-body-bold',
  },
  'large'
)

const iconSize = useMapper<AccordionSize, IconSize>(
  () => controller.size,
  {
    small: 'medium',
    large: 'large',
  },
  'large'
)

const className = computed(() =>
  toVariants({
    size: controller.size,
    muted: item.isDisabled,
    expanded: item.isExpanded,
  })
)
</script>

<style lang="postcss" scoped>
.ui-accordion-item-title {
  margin: 0;

  .trigger {
    display: flex;
    justify-content: space-between;
    gap: 1.6rem;
    width: 100%;
    color: var(--color-brand-txt-base);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    position: relative;
    text-align: start;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: scale(1.08, 2.3);
    }

    &:focus {
      outline: none;
    }
  }

  &.muted .trigger {
    cursor: default;
    color: var(--color-neutral-txt-secondary);
  }

  &:not(.muted) .trigger {
    &:hover {
      color: var(--color-brand-txt-hover);
    }

    &:active {
      color: var(--color-brand-txt-active);
    }
  }

  &.size--small {
    margin-bottom: 0.4rem;
  }

  &.size--large.expanded {
    margin-bottom: 1.2rem;
  }
}
</style>
