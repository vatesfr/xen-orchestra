<!-- v2 -->
<template>
  <div v-if="!isDisabled" ref="tooltipElement" class="ui-tooltip typo-body-regular-small">
    {{ content }}
  </div>
</template>

<script lang="ts" setup>
import type { TooltipOptions } from '@core/stores/tooltip.store'
import { hasEllipsis } from '@core/utils/has-ellipsis.util'
import { isString } from 'lodash-es'
import place from 'placement.js'
import { computed, ref, watch, watchEffect } from 'vue'

const props = defineProps<{
  target: HTMLElement
  options: TooltipOptions
}>()

const tooltipElement = ref<HTMLElement>()

const content = computed(() => {
  if (props.options.content === false) {
    return false
  }

  if (isString(props.options.content)) {
    return props.options.content.trim() === '' ? false : props.options.content
  }

  const ellipsisTarget = props.options.selector ? props.target.querySelector(props.options.selector) : props.target

  if (!ellipsisTarget || !hasEllipsis(ellipsisTarget, { vertical: props.options.vertical })) {
    return false
  }

  return ellipsisTarget.textContent?.trim() ?? false
})

const isDisabled = computed(() => content.value === false)

const placement = computed(() => props.options.placement ?? 'top')

function updatePlacement() {
  if (!tooltipElement.value) {
    return
  }

  place(props.target, tooltipElement.value, {
    placement: placement.value,
  })
}

watchEffect(() => updatePlacement(), { flush: 'post' })

watch(content, () => updatePlacement(), { flush: 'post' })
</script>

<style lang="postcss" scoped>
.ui-tooltip {
  position: relative;
  display: inline-flex;
  padding: 0.4rem 0.8rem;
  pointer-events: none;
  color: var(--color-neutral-background-primary);
  border-radius: 0.4rem;
  background-color: var(--color-neutral-txt-primary);
  z-index: 999999;

  [data-placement^='top'] {
    margin-bottom: 0.7rem;
  }

  [data-placement^='right'] {
    margin-left: 0.7rem;
  }

  [data-placement^='bottom'] {
    margin-top: 0.7rem;
  }

  [data-placement^='left'] {
    margin-right: 0.7rem;
  }
}
</style>
