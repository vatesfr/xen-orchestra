<template>
  <div
    class="vts-card-row-key-value typo-body-regular-small"
    :class="{ truncate: shouldTruncate, 'align-top': alignTop }"
  >
    <div class="key">
      <slot name="key" />
    </div>
    <div class="value-container">
      <div ref="truncatableValueElement" class="value" :class="{ truncated: shouldTruncate && !isExpanded }">
        <slot name="value" />
      </div>
      <UiButtonIcon
        v-if="shouldTruncate"
        v-tooltip="isExpanded ? t('action:show-less') : t('action:show-more')"
        :icon="isExpanded ? 'fa:chevron-up' : 'fa:chevron-down'"
        class="show-more"
        size="small"
        accent="brand"
        @click="toggleExpanded()"
      />
    </div>
    <div v-if="slots.addons" class="addons">
      <slot name="addons" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { calculateLineCount } from '@core/utils/line-height.util.ts'
import { useStyleTag } from '@vueuse/core'
import { useToggle } from '@vueuse/shared'
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { truncate } = defineProps<{
  truncate?: number | boolean
  alignTop?: boolean
}>()

const slots = defineSlots<{
  key(): any
  value(): any
  addons?(): any
}>()

const DEFAULT_MAX_LINES = 5

const { t } = useI18n()

const truncatableValueElementRef = useTemplateRef('truncatableValueElement')
const lineCount = ref(0)

const isTruncationEnabled = computed(() => truncate !== undefined && truncate !== false)

const lineLimit = computed(() => {
  if (typeof truncate === 'number') {
    return truncate
  }

  return DEFAULT_MAX_LINES
})

const shouldTruncate = computed(() => isTruncationEnabled.value && lineCount.value > lineLimit.value)

const [isExpanded, toggleExpanded] = useToggle(false)

const calculateLines = async () => {
  await nextTick()

  if (!truncatableValueElementRef.value) {
    return
  }

  lineCount.value = calculateLineCount(truncatableValueElementRef.value)
}

const style = computed(() => {
  if (!(shouldTruncate.value || isExpanded.value)) {
    return ''
  }

  return `.vts-card-row-key-value.truncate .value.truncated { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${lineLimit.value}; line-clamp: ${lineLimit.value}; overflow: hidden; text-overflow: ellipsis; }`
})

useStyleTag(style)

onMounted(() => calculateLines())

watch(
  () => slots.value?.(),
  () => calculateLines()
)
</script>

<style lang="postcss" scoped>
.vts-card-row-key-value {
  display: flex;
  align-items: center;
  column-gap: 1.6rem;

  &.truncate {
    display: grid;
    row-gap: 0.4rem;
    grid-template-columns: 1fr auto;

    .key {
      grid-column: 1 / -1;
      grid-row: 1;
    }

    .addons {
      grid-column: 2;
      grid-row: 1;
    }

    .value-container {
      grid-column: 1 / -1;
    }
  }

  &.align-top:not(.truncate) {
    align-items: flex-start;
  }

  .key {
    overflow-wrap: break-word;
    color: var(--color-neutral-txt-secondary);
  }

  .value-container {
    display: flex;
    align-items: end;
    gap: 0.8rem;

    .value {
      color: var(--color-neutral-txt-primary);
    }

    .show-more {
      flex-shrink: 0;
    }
  }

  .value:empty::before {
    content: '-';
  }

  .addons {
    display: flex;
    gap: 0.8rem;
    margin-left: auto;
    font-size: 1.6rem;
    align-items: center;
  }
}
</style>
