<template>
  <UiTertiaryTag
    v-if="parsedTag"
    ref="tertiaryTag"
    v-tooltip="isTertiaryTagTruncated && value"
    :accent
    :removable
    :truncate="!wrap"
    :wrap
    @remove="emit('remove')"
  >
    <template #term>{{ parsedTag.term }}</template>
    {{ parsedTag.label }}
  </UiTertiaryTag>
  <UiTag
    v-else
    v-tooltip
    :accent
    :removable
    :variant
    :class="{ truncate: !wrap }"
    class="vts-tag"
    @remove="emit('remove')"
  >
    <span v-if="isEmpty" class="empty">{{ t('empty-tag') }}</span>
    <template v-else>{{ value }}</template>
  </UiTag>
</template>

<script lang="ts" setup>
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import UiTertiaryTag from '@core/components/ui/tag/UiTertiaryTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { hasEllipsis } from '@core/utils/has-ellipsis.util.ts'
import { parseTag } from '@core/utils/parse-tag.util.ts'
import { useResizeObserver } from '@vueuse/core'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

type TagVariant = 'primary' | 'secondary'

const {
  value,
  accent = 'info',
  variant = 'secondary',
} = defineProps<{
  value: string
  accent?: TagAccent
  variant?: TagVariant
  wrap?: boolean
  removable?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

const { t } = useI18n()

const parsedTag = computed(() => parseTag(value))

const isEmpty = computed(() => value.trim() === '')

const tertiaryTag = useTemplateRef('tertiaryTag')

const tertiaryTagElement = computed(() => tertiaryTag.value?.$el as HTMLElement | undefined)

const isTertiaryTagTruncated = ref(false)

function updateTertiaryTagTruncation() {
  const element = tertiaryTagElement.value

  isTertiaryTagTruncated.value = element !== undefined && [...element.children].some(part => hasEllipsis(part))
}

useResizeObserver(tertiaryTagElement, () => updateTertiaryTagTruncation())

watch(
  () => value,
  () => updateTertiaryTagTruncation(),
  { flush: 'post' }
)
</script>

<style lang="postcss" scoped>
.vts-tag {
  &.truncate {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .empty {
    font-style: italic;
  }
}
</style>
