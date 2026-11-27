<template>
  <div class="backup-job-review-scope-preview">
    <span class="count typo-body-regular-small">{{ countLabel }}</span>
    <UiCollapsibleList tag="div" :total-items="items.length">
      <span v-for="item of items" :key="item.id" class="item">
        <UiObjectLink :route="item.route" :icon="item.icon">
          {{ item.label }}
        </UiObjectLink>
        <UiOverridden v-if="addedIds?.includes(item.id)">{{ t('added') }}</UiOverridden>
      </span>
    </UiCollapsibleList>
    <UiOverridden v-if="deletedLabel">{{ deletedLabel }}</UiOverridden>
  </div>
</template>

<script lang="ts" setup>
import type { QueryBuilderPreviewItem } from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiOverridden from '@core/components/ui/overridden/UiOverridden.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  items: QueryBuilderPreviewItem[]
  countLabel: string
  addedIds?: string[]
  deletedLabel?: string
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-review-scope-preview {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-block-end: 0.4rem;

  .count {
    color: var(--color-neutral-txt-secondary);
  }

  .item {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem 1.6rem;
  }
}
</style>
