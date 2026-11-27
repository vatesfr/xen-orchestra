<template>
  <div class="vm-backup-archive-restore-disk-cell">
    <VtsIcon name="object:vdi" size="medium" />
    <div class="texts">
      <span v-tooltip class="text-ellipsis">{{ name }}</span>
      <span v-if="note !== undefined" v-tooltip class="note typo-body-regular-small text-ellipsis">{{ note }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'

defineProps<{
  name: string
  note?: string
}>()
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-disk-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;

  .texts {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .note {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
