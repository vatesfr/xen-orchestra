<template>
  <li>
    <VtsMenuTrigger v-bind="{ ...props, ...attrs }">
      <slot />
    </VtsMenuTrigger>
  </li>
</template>

<script lang="ts" setup>
import VtsMenuTrigger, { type MenuTriggerProps } from '@core/components/menu/VtsMenuTrigger.vue'
import { useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<MenuTriggerProps>()
const attrs = useAttrs()
</script>
