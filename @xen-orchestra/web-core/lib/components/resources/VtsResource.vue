<template>
  <li class="vts-resource">
    <VtsIcon :name="icon" size="medium" class="icon" />
    <div class="separator" />
    <div class="label typo-h6">{{ label }}</div>
    <div class="count typo-body-regular-small">{{ count }}</div>
  </li>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import type { IconName } from '@core/icons'

defineProps<{
  icon: IconName
  label: string
  count: string | number
}>()
</script>

<style lang="postcss" scoped>
.vts-resource {
  display: flex;
  align-items: center;
}

.icon {
  font-size: 3.2rem;
}

.separator {
  height: 4.5rem;
  width: 0;
  border-left: 0.1rem solid var(--color-brand-txt-base);
  background-color: var(--color-brand-txt-base);
  margin: 0 1.5rem;
}

.count {
  margin-left: 2rem;
}
</style>
