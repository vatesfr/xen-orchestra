<template>
  <UiTableCell>
    <div class="content">
      <span class="text">
        {{ truncatedContent }}
      </span>

      <UiButton
        v-if="shouldTruncate"
        accent="brand"
        size="small"
        variant="tertiary"
        class="typo-body-regular-small button"
        @click="toggleExpanded()"
      >
        {{ isExpanded ? t('show-less') : t('show-more') }}
      </UiButton>
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { useToggle } from '@vueuse/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { content, limit } = defineProps<{
  content: string
  limit?: number
}>()

const DEFAULT_TRUNCATE_LIMIT = 90

const TRUNCATE_TOLERANCE = 20

const { t } = useI18n()

const truncateLimit = computed(() => limit ?? DEFAULT_TRUNCATE_LIMIT)

const shouldTruncate = computed(() => content.length > truncateLimit.value + TRUNCATE_TOLERANCE)

const [isExpanded, toggleExpanded] = useToggle(false)

const truncatedContent = computed(() => {
  if (!shouldTruncate.value || isExpanded.value) {
    return content
  }

  return `${content.slice(0, truncateLimit.value)}…`
})
</script>

<style lang="postcss" scoped>
.text {
  overflow-wrap: anywhere;
}

.button {
  float: right;
  margin-top: -0.25rem;
}
</style>
