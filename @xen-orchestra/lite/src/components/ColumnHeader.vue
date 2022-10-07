<template>
  <th>
    <div class="content">
      <span class="label">
        <UiIcon :icon="icon" />
        <slot />
      </span>
    </div>
  </th>
</template>

<script lang="ts" setup>
import type { IconDefinition } from "@fortawesome/fontawesome-common-types";
import UiIcon from "@/components/ui/UiIcon.vue";

defineProps<{
  icon?: IconDefinition;
}>();
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
