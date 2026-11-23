<template>
  <span
    ref="root"
    v-tooltip="isSplit ? text : true"
    :class="{ split: isSplit }"
    :data-text="text"
    class="vts-middle-ellipsis text-ellipsis"
  >
    <template v-if="isSplit">
      <span aria-hidden="true" class="head text-ellipsis">{{ head }}</span>
      <span aria-hidden="true" class="tail">{{ tail }}</span>
    </template>
    <template v-else>{{ text }}</template>
  </span>
</template>

<script lang="ts" setup>
import { useCollapseOnOverflow } from '@core/composables/collapse-on-overflow.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed, useTemplateRef, watch } from 'vue'

const { text, tailLength = 10 } = defineProps<{
  text: string
  tailLength?: number
}>()

const characters = computed(() => Array.from(text))

const head = computed(() => characters.value.slice(0, -tailLength).join(''))

const tail = computed(() => characters.value.slice(-tailLength).join(''))

const rootElement = useTemplateRef('root')

const { collapsedCount, reset } = useCollapseOnOverflow(rootElement, rootElement, () => (head.value === '' ? 0 : 1))

const isSplit = computed(() => collapsedCount.value > 0)

watch(
  () => text,
  () => reset()
)
</script>

<style lang="postcss" scoped>
.vts-middle-ellipsis {
  display: block;

  &.split {
    display: flex;
    white-space: pre;

    &::before {
      content: '\200B' / attr(data-text);
      position: absolute;
    }

    .head {
      white-space: pre;
    }

    .tail {
      flex-shrink: 0;
    }
  }
}
</style>
