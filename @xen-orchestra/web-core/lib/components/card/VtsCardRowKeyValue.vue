<template>
  <div class="vts-card-row-key-value typo-body-regular-small" :class="className">
    <div ref="keyValue" class="key-value">
      <div class="key">
        <slot name="key" />
        <div v-if="multipleValues && isStacked" class="addons">
          <slot name="addons" />
          <VtsCopyAllMenuItem :values="multipleValues" />
        </div>
      </div>
      <CardRowValueList v-if="multipleValues" :values="multipleValues" :max-visible-values>
        <template v-if="!isStacked" #first-row-addons>
          <slot name="addons" />
          <VtsCopyAllMenuItem :values="multipleValues" />
        </template>
      </CardRowValueList>
      <div v-else class="value-container">
        <div ref="truncatableValueElement" class="value" :class="{ truncated: shouldTruncate && !isExpanded }">
          <slot name="value">
            <template v-if="singleValue !== undefined">{{ singleValue }}</template>
          </slot>
        </div>
      </div>
    </div>
    <div v-if="!multipleValues && (slots.addons || singleValue !== undefined || shouldTruncate)" class="actions">
      <div v-if="slots.addons || singleValue !== undefined" class="addons">
        <slot name="addons" />
        <VtsCopyButton v-if="singleValue !== undefined" :value="singleValue" />
      </div>
      <div v-if="shouldTruncate" class="show-more">
        <UiButtonIcon
          v-tooltip="isExpanded ? t('action:show-less') : t('action:show-more')"
          :icon="isExpanded ? 'fa:chevron-up' : 'fa:chevron-down'"
          size="small"
          accent="brand"
          @click="toggleExpanded()"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CardRowValueList from '@core/components/card/CardRowValueList.vue'
import VtsCopyAllMenuItem from '@core/components/copy-all-menu-item/VtsCopyAllMenuItem.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { calculateLineCount } from '@core/utils/line-height.util.ts'
import { useResizeObserver, useStyleTag } from '@vueuse/core'
import { useToggle } from '@vueuse/shared'
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { truncate, alignTop, values } = defineProps<{
  truncate?: number | boolean
  alignTop?: boolean
  values?: string[]
  maxVisibleValues?: number
}>()

const slots = defineSlots<{
  key(): any
  value?(): any
  addons?(): any
}>()

const DEFAULT_MAX_LINES = 5

const { t } = useI18n()

const multipleValues = computed(() => (values !== undefined && values.length > 1 ? values : undefined))

const singleValue = computed(() => (values?.length === 1 ? values[0] : undefined))

const keyValueRef = useTemplateRef('keyValue')
const isStacked = ref(false)

useResizeObserver(
  () => (multipleValues.value !== undefined ? keyValueRef.value : undefined),
  () => {
    const key = keyValueRef.value?.firstElementChild
    const valueList = keyValueRef.value?.lastElementChild

    isStacked.value =
      key instanceof HTMLElement && valueList instanceof HTMLElement && valueList.offsetTop > key.offsetTop
  }
)

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

const className = computed(() => ({
  truncate: shouldTruncate.value,
  'align-top': alignTop,
  'multiple-values': multipleValues.value !== undefined,
  stacked: isStacked.value,
}))

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

watch([() => slots.value?.(), () => values], () => calculateLines())
</script>

<style lang="postcss" scoped>
.vts-card-row-key-value {
  display: flex;
  align-items: flex-start;
  column-gap: 1.6rem;

  .key-value {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 1.6rem;
    min-width: 0;
  }

  &.align-top .key-value,
  &.multiple-values .key-value {
    align-items: flex-start;
  }

  &.multiple-values.stacked .key {
    display: flex;
    flex-grow: 1;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .key {
    overflow-wrap: break-word;
    color: var(--color-neutral-txt-secondary);
  }

  .value-container {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;

    .value {
      min-width: 0;
      color: var(--color-neutral-txt-primary);

      :slotted(*) {
        vertical-align: middle;
      }
    }
  }

  .value:empty::before {
    content: '-';
  }

  .actions {
    display: flex;
    flex-direction: column;
    align-self: stretch;
    align-items: flex-end;
  }

  .addons,
  .show-more {
    display: flex;
    gap: 0.8rem;
    height: 1lh;
    align-items: center;
  }

  .show-more {
    margin-block-start: auto;
  }
}
</style>
