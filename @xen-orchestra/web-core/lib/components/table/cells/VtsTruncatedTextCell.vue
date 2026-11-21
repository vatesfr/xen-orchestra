<template>
  <UiTableCell>
    <div :class="{ expanded: isExpanded }" class="content">
      <span ref="text" v-tooltip class="text text-ellipsis">
        {{ content }}
      </span>

      <UiButton
        v-if="isExpanded || isTruncated"
        accent="brand"
        size="small"
        variant="tertiary"
        class="typo-body-regular-small button"
        @click="toggleExpanded()"
      >
        {{ isExpanded ? t('action:show-less') : t('action:show-more') }}
      </UiButton>
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { hasEllipsis } from '@core/utils/has-ellipsis.util.ts'
import { useResizeObserver } from '@vueuse/core'
import { useToggle } from '@vueuse/shared'
import { ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { content } = defineProps<{
  content: string
}>()

const { t } = useI18n()

const [isExpanded, toggleExpanded] = useToggle(false)

const textElement = useTemplateRef('text')

const isTruncated = ref(false)

function updateTruncation() {
  isTruncated.value = hasEllipsis(textElement.value)
}

useResizeObserver(textElement, () => updateTruncation())

watch(
  () => content,
  () => updateTruncation(),
  { flush: 'post' }
)
</script>

<style lang="postcss" scoped>
.content {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  max-width: 30rem;

  &.expanded {
    display: block;

    .text {
      white-space: normal;
    }

    .button {
      float: right;
      margin-top: -0.25rem;
    }
  }
}

.text {
  overflow-wrap: anywhere;
}

.button {
  flex-shrink: 0;
  margin-inline-start: auto;
}
</style>
