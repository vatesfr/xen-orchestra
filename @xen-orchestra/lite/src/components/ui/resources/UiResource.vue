<template>
  <li class="ui-resource">
    <UiIcon :icon class="icon" />
    <div class="separator" />
    <div class="label">{{ label }}</div>
    <div class="count">{{ count }}</div>
  </li>
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

defineProps<{
  icon: IconDefinition
  label: string
  count: string | number
}>()
</script>

<style lang="postcss" scoped>
.ui-resource {
  display: flex;
  align-items: center;
}

.icon {
  color: var(--color-purple-base);
  font-size: 3.2rem;
}

.separator {
  height: 4.5rem;
  width: 0;
  border-left: 0.1rem solid var(--color-purple-base);
  background-color: var(--color-purple-base);
  margin: 0 1.5rem;
}

.label {
  font-size: 1.6rem;
  font-weight: 700;
}

.count {
  font-size: 1.4rem;
  font-weight: 400;
  margin-left: 2rem;
}
</style>
