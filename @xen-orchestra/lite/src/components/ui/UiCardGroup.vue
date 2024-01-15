<template>
  <div :class="{ vertical }" class="ui-card-group">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { IK_CARD_GROUP_VERTICAL } from '@/types/injection-keys'
import { inject, provide } from 'vue'

const vertical = inject(IK_CARD_GROUP_VERTICAL, false)

provide(IK_CARD_GROUP_VERTICAL, !vertical)
</script>

<style lang="postcss" scoped>
.ui-card-group {
  display: flex;
  gap: 1rem;
  flex-direction: column;
  flex: 1;
}

@media (min-width: 1500px) {
  .ui-card-group:not(.vertical) {
    flex-direction: row;
  }
}
</style>
