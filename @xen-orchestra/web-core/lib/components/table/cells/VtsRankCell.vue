<template>
  <UiTableCell class="vts-rank-cell" :class="{ highlighted }">
    <div class="content">
      <span :class="{ 'typo-body-bold': highlighted }">{{ label }}</span>
      <span v-if="shiftIcon" class="shift">
        <VtsIcon :name="shiftIcon" size="small" />
        {{ shiftCount }}
      </span>
    </div>
  </UiTableCell>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { IconName } from '@core/icons'
import { computed } from 'vue'

const {
  rank,
  shift = 0,
  highlighted,
} = defineProps<{
  rank: number
  shift?: number
  highlighted?: boolean
}>()

const label = computed(() => (highlighted ? `#${rank}` : rank))

const shiftIcon = computed<IconName | undefined>(() => {
  if (shift > 0) {
    return 'action:move-up'
  }

  if (shift < 0) {
    return 'action:move-down'
  }

  return undefined
})

const shiftCount = computed(() => Math.abs(shift))
</script>

<style lang="postcss" scoped>
.vts-rank-cell {
  .content {
    display: flex;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .shift {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--color-neutral-txt-secondary);
  }

  &.highlighted {
    color: var(--color-brand-txt-base);

    .content {
      justify-content: flex-end;
    }
  }
}
</style>
