<template>
  <UiTableCell>
    <div v-if="items.length > 1 && !isExpanded" class="content">
      <span :class="{ highlighted: highlightFirst }">{{ items[0] }}</span>
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
      <li v-for="(item, index) of items" :key="index">
        <div class="content">
          <span :class="{ highlighted: highlightFirst && index === 0 }">{{ item }}</span>
          <UiButton
            v-if="isExpanded && index === 0"
            accent="brand"
            size="small"
            variant="tertiary"
            class="typo-body-regular-small more"
            @click="toggleExpand(false)"
          >
            <VtsIcon size="small" name="fa:minus" />
          </UiButton>
        </div>
      </li>
    </ul>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { MaybeArray } from '@core/types/utility.type'
import { useToggle } from '@vueuse/shared'

defineProps<{
  items: MaybeArray<string>
  highlightFirst?: boolean
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

.highlighted {
  color: var(--color-brand-txt-base);
  font-weight: 500;
}
</style>
