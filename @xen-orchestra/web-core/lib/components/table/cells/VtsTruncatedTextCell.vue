<template>
  <UiTableCell :class="{ expanded: isExpanded }" class="vts-truncated-text-cell">
    <div class="content">
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
.vts-truncated-text-cell {
  max-width: 30rem;

  .content {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .text {
    overflow-wrap: anywhere;
  }

  .button {
    flex-shrink: 0;
    margin-inline-start: auto;
  }

  &.expanded {
    min-width: 30rem;

    .content {
      align-items: baseline;
    }

    .text {
      white-space: normal;
    }
  }
}
</style>
