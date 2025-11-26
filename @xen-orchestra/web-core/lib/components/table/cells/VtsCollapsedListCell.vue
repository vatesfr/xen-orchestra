<template>
  <UiTableCell>
    <div v-if="items.length > 1 && !isExpanded" class="content">
      {{ items[0] }}
      <UiButton
        accent="brand"
        size="small"
        variant="tertiary"
        class="typo-body-regular-small more"
        @click="toggleExpand(true)"
      >
        {{ `+${items.length - 1}` }}
      </UiButton>
    </div>
    <ul v-else>
      <li v-for="(item, index) of items" :key="index">{{ item }}</li>
    </ul>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { MaybeArray } from '@core/types/utility.type'
import { useToggle } from '@vueuse/shared'

defineProps<{
  items: MaybeArray<string>
}>()

const [isExpanded, toggleExpand] = useToggle()
</script>

<style lang="postcss" scoped>
.content {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .more {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
