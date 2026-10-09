<!-- v7 -->
<template>
  <div class="ui-accordion-item" :class="className">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useDisabled } from '@core/composables/disabled.composable.ts'
import { injectStrict } from '@core/utils/inject-strict.util.ts'
import { IK_ACCORDION_CONTROLLER, IK_ACCORDION_ITEM } from '@core/utils/injection-keys.util.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed, onBeforeUnmount, provide, reactive, useId, watch } from 'vue'

export type AccordionItemContext = {
  id: string
  isDisabled: boolean
  isExpanded: boolean
  toggle: () => void
}

const { disabled } = defineProps<{
  disabled?: boolean
}>()

const isExpanded = defineModel<boolean>('expanded', { default: false })

defineSlots<{
  default(): any
}>()

const controller = injectStrict(IK_ACCORDION_CONTROLLER, 'UiAccordionItem must be used inside UiAccordion')

const id = useId()

const isDisabled = useDisabled(() => disabled)

controller.register(id, () => {
  isExpanded.value = false
})

onBeforeUnmount(() => controller.unregister(id))

watch(
  isExpanded,
  expanded => {
    if (expanded) {
      controller.notifyExpanded(id)
    }
  },
  { immediate: true }
)

function toggle() {
  isExpanded.value = !isExpanded.value
}

const item = reactive({
  id,
  isDisabled,
  isExpanded,
  toggle,
}) satisfies AccordionItemContext

provide(IK_ACCORDION_ITEM, item)

const className = computed(() => toVariants({ size: controller.size }))
</script>

<style lang="postcss" scoped>
.ui-accordion-item {
  display: flex;
  flex-direction: column;

  &:has(> .ui-accordion-item-title :focus-visible) {
    outline: 0.2rem solid var(--color-brand-txt-base);
    border-radius: 0.4rem;
    outline-offset: 0.2rem;
  }

  &.size--large {
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.4rem;
    padding: 1.6rem;
  }
}
</style>
