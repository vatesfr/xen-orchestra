<template>
  <li class="ui-resource">
    <UiIcon :icon class="icon" />
    <div class="separator" />
    <div class="label typo h6-semi-bold">{{ label }}</div>
    <div class="count typo p2-regular">{{ count }}</div>
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
  color: var(--color-info-txt-base);
  font-size: 3.2rem;
}

.separator {
  height: 4.5rem;
  width: 0;
  border-left: 0.1rem solid var(--color-info-txt-base);
  background-color: var(--color-info-txt-base);
  margin: 0 1.5rem;
}

.count {
  margin-left: 2rem;
}
</style>
