<template>
  <div ref="content" class="vts-head-bar-actions">
    <slot :is-inline />
  </div>
</template>

<script lang="ts" setup generic="TAction extends string">
import { useCollapseOnOverflow } from '@core/composables/collapse-on-overflow.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { IK_HIDE_ACTION_BUTTON_BUSY } from '@core/utils/injection-keys.util.ts'
import { objectFromEntries } from '@core/utils/object.util.ts'
import { computed, provide, useTemplateRef, watch } from 'vue'

const { actions } = defineProps<{
  actions: TAction[]
}>()

defineSlots<{
  default(props: { isInline: Partial<Record<TAction, boolean>> }): any
}>()

const uiStore = useUiStore()

const content = useTemplateRef('content')

const container = computed(() => content.value?.parentElement)

const { collapsedCount, reset } = useCollapseOnOverflow(container, content, () => actions.length)

const inlineCount = computed(() => (uiStore.isSmall ? 0 : actions.length - collapsedCount.value))

const isInline = computed(
  (): Partial<Record<TAction, boolean>> =>
    objectFromEntries(actions.slice(0, inlineCount.value).map(action => [action, true] as const))
)

watch(
  () => actions.join(),
  () => reset()
)

provide(IK_HIDE_ACTION_BUTTON_BUSY, true)
</script>

<style lang="postcss" scoped>
.vts-head-bar-actions {
  margin-inline-start: auto;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  white-space: nowrap;
}

:global(.ui-head-bar:has(> .actions > .vts-head-bar-actions)) {
  flex-wrap: nowrap;
}

@media (--medium-or-large) {
  :global(.ui-head-bar > .actions:has(> .vts-head-bar-actions)) {
    flex: 0 1 50%;
  }
}
</style>
