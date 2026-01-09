<template>
  <div class="vts-card-row-key-value typo-body-regular-small" :class="{ 'no-key': noKey }">
    <div v-if="!noKey && slots.key" class="key">
      <slot name="key" />
    </div>
    <div class="value-container">
      <div ref="truncatableValueRef" class="value" :class="{ truncated: shouldTruncate && !isExpanded }">
        <slot name="value" />
      </div>
      <UiButtonIcon
        v-if="shouldTruncate"
        v-tooltip="isExpanded ? t('action:show-less') : t('action:show-more')"
        :icon="isExpanded ? 'fa:chevron-up' : 'fa:chevron-down'"
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
import { useToggle } from '@vueuse/shared'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { maxLines } = defineProps<{
  noKey?: boolean
  maxLines?: number | boolean
}>()
const slots = defineSlots<{
  key?(): any
  value(): any
  addons?(): any
}>()

const DEFAULT_MAX_LINES = 5

const { t } = useI18n()

const truncatableValueRef = ref<HTMLElement>()
const lineCount = ref(0)

const isTruncationEnabled = computed(() => maxLines !== undefined && maxLines !== false)

const lineLimit = computed(() => {
  if (typeof maxLines === 'number') {
    return maxLines
  }
  return DEFAULT_MAX_LINES
})

const shouldTruncate = computed(() => isTruncationEnabled.value && lineCount.value > lineLimit.value)

const [isExpanded, toggleExpanded] = useToggle(false)

const calculateLines = async () => {
  await nextTick()

  if (!truncatableValueRef.value) {
    return
  }

  const lineHeight = parseFloat(getComputedStyle(truncatableValueRef.value).lineHeight)
  const height = truncatableValueRef.value.scrollHeight

  lineCount.value = Math.round(height / lineHeight)
}

onMounted(() => {
  calculateLines()
})

watch(
  () => slots.value?.(),
  () => {
    calculateLines()
  }
)
</script>

<style lang="postcss" scoped>
.vts-card-row-key-value {
  display: flex;
  align-items: center;
  gap: 1.6rem;

  .key {
    overflow-wrap: break-word;
    color: var(--color-neutral-txt-secondary);
  }

  .value-container {
    display: flex;
    align-items: end;
    .value {
      max-width: 25rem;
      color: var(--color-neutral-txt-primary);
      overflow-wrap: anywhere;
      word-break: break-word;
      white-space: normal;
    }
  }

  .value.truncated {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: v-bind(lineLimit);
    overflow: hidden;
    text-overflow: ellipsis;
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

  &.no-key {
    .value-container {
      flex: 1;
      .value {
        flex: 1;
        font-family: 'Courier New', Courier, monospace;
        font-size: 1.2rem;
        color: var(--color-neutral-border);
        max-width: none;
      }
    }
  }
}
</style>
