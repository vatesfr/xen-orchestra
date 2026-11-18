<template>
  <li role="none">
    <VtsDropdownTitle>
      <slot />
    </VtsDropdownTitle>
  </li>
</template>

<script lang="ts" setup>
import VtsDropdownTitle from '@core/components/dropdown/VtsDropdownTitle.vue'

defineSlots<{
  default(): any
}>()
</script>
