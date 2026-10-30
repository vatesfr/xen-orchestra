<template>
  <div class="backup-job-review-scope-preview">
    <span class="count typo-body-regular-small">{{ countLabel }}</span>
    <UiCollapsibleList tag="div" :total-items="items.length">
      <UiObjectLink v-for="item of items" :key="item.id" :route="item.route" :icon="item.icon">
        {{ item.label }}
      </UiObjectLink>
    </UiCollapsibleList>
  </div>
</template>

<script lang="ts" setup>
import type { QueryBuilderPreviewItem } from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'

defineProps<{
  items: QueryBuilderPreviewItem[]
  countLabel: string
}>()
</script>

<style lang="postcss" scoped>
.backup-job-review-scope-preview {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .count {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
