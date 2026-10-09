<!-- v7 -->
<template>
  <div class="ui-accordion-item-content">
    <div class="divider-wrapper" :class="{ visible: isDividerVisible }">
      <div class="divider-inner">
        <VtsDivider type="stretch" />
      </div>
    </div>
    <div class="panel-wrapper" :class="{ expanded: item.isExpanded }">
      <div
        :id="`${item.id}-content`"
        role="region"
        :aria-labelledby="`${item.id}-title`"
        :inert="!item.isExpanded"
        class="panel-inner"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import { injectStrict } from '@core/utils/inject-strict.util.ts'
import { IK_ACCORDION_CONTROLLER, IK_ACCORDION_ITEM } from '@core/utils/injection-keys.util.ts'
import { computed } from 'vue'

defineSlots<{
  default(): any
}>()

const controller = injectStrict(IK_ACCORDION_CONTROLLER, 'UiAccordionItemContent must be used inside UiAccordion')

const item = injectStrict(IK_ACCORDION_ITEM, 'UiAccordionItemContent must be used inside UiAccordionItem')

const isDividerVisible = computed(() => item.isExpanded || controller.size === 'small')
</script>

<style lang="postcss" scoped>
.ui-accordion-item-content {
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
