<template>
  <UiTableCell>
    <UiTagsList>
      <template v-for="tagItem of parsedTags" :key="tagItem.raw">
        <span v-if="tagItem.scoped" class="scoped-tag typo-body-regular-small">
          <span class="tag-key">{{ tagItem.key }}</span>
          <span class="tag-value">{{ tagItem.value }}</span>
        </span>
        <UiTag v-else accent="info" variant="secondary">{{ tagItem.raw }}</UiTag>
      </template>
    </UiTagsList>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import type { MaybeArray } from '@core/types/utility.type'
import { parseScopedTag } from '@core/utils/scoped-tag.util'
import { toArray } from '@core/utils/to-array.utils'
import { computed } from 'vue'

const { tag } = defineProps<{
  tag: MaybeArray<string>
}>()

const parsedTags = computed(() =>
  toArray(tag)
    .filter(tagItem => tagItem.trim() !== '')
    .map(tagItem => {
      const scoped = parseScopedTag(tagItem)

      return scoped === null
        ? { raw: tagItem, scoped: false as const }
        : { raw: tagItem, scoped: true as const, key: scoped.key, value: scoped.value }
    })
)
</script>

<style lang="postcss" scoped>
.scoped-tag {
  display: inline-flex;
  border-radius: 0.4rem;
  overflow: hidden;

  .tag-key {
    padding: 0.2rem 0.6rem;
    background-color: var(--color-neutral-background-disabled);
    color: var(--color-neutral-txt-secondary);
  }

  .tag-value {
    padding: 0.2rem 0.6rem;
    background-color: var(--color-info-item-base);
    color: var(--color-info-txt-item);
  }
}
</style>
