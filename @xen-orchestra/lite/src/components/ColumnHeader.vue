<template>
  <th>
    <div class="content">
      <span class="label">
        <VtsIcon :name="icon" size="medium" />
        <slot />
      </span>
    </div>
  </th>
</template>

<script lang="ts" setup>
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'

defineProps<{
  icon?: IconName
}>()
</script>

<style lang="postcss" scoped>
.content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.label {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-icon {
  cursor: pointer;
}
</style>
