<template>
  <DisplayIconStack v-if="isIconStack(icon)" :stack="icon" :stroke :color />
  <DisplayIconSingle v-else :icon :color :stroke />
</template>

<script lang="ts" setup>
import DisplayIconSingle from './DisplayIconSingle.vue'
import DisplayIconStack from './DisplayIconStack.vue'
import { isIconStack } from './is-icon-stack.ts'
import { type Icon } from './types.ts'

defineProps<{
  icon: Icon
  color?: string
  stroke?: string
}>()
</script>
