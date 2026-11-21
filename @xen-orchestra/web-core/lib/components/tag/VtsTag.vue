<template>
  <UiTertiaryTag v-if="parsedTag" ref="tertiaryTag" v-tooltip="isTertiaryTagTruncated && value" :accent truncate>
    <template #term>{{ parsedTag.term }}</template>
    {{ parsedTag.label }}
  </UiTertiaryTag>
  <UiTag v-else v-tooltip :accent :variant class="vts-tag">
    {{ value }}
  </UiTag>
</template>

<script lang="ts" setup>
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import UiTertiaryTag from '@core/components/ui/tag/UiTertiaryTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { hasEllipsis } from '@core/utils/has-ellipsis.util.ts'
import { parseTag } from '@core/utils/parse-tag.util.ts'
import { unrefElement, useResizeObserver } from '@vueuse/core'
import { computed, ref, useTemplateRef, watch } from 'vue'

type TagVariant = 'primary' | 'secondary'

const {
  value,
  accent = 'info',
  variant = 'secondary',
} = defineProps<{
  value: string
  accent?: TagAccent
  variant?: TagVariant
}>()

const parsedTag = computed(() => parseTag(value))

const tertiaryTag = useTemplateRef('tertiaryTag')

const isTertiaryTagTruncated = ref(false)

function updateTertiaryTagTruncation() {
  const element = unrefElement(tertiaryTag)

  isTertiaryTagTruncated.value =
    element !== null && element !== undefined && [...element.children].some(part => hasEllipsis(part))
}

useResizeObserver(tertiaryTag, () => updateTertiaryTagTruncation())

watch(
  () => value,
  () => updateTertiaryTagTruncation(),
  { flush: 'post' }
)
</script>

<style lang="postcss" scoped>
.vts-tag {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
