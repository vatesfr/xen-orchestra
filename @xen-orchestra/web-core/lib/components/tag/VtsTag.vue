<template>
  <span v-if="parsed !== null" class="vts-tag typo-body-regular-small">
    <span class="tag-key">{{ parsed.key }}</span>
    <span class="tag-value">{{ parsed.value }}</span>
  </span>
  <UiTag v-else accent="info" variant="secondary">{{ tag }}</UiTag>
</template>

<script lang="ts" setup>
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { parseScopedTag } from '@core/utils/scoped-tag.util'
import { computed } from 'vue'

const { tag } = defineProps<{
  tag: string
}>()

const parsed = computed(() => parseScopedTag(tag))
</script>

<style lang="postcss" scoped>
.vts-tag {
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
