<template>
  <DisplayIconStack v-if="isIconStack(icon)" :stack="icon" :stroke />
  <DisplayIconSingle v-else :icon :stroke />
</template>

<script lang="ts" setup>
import DisplayIconSingle from './DisplayIconSingle.vue'
import DisplayIconStack from './DisplayIconStack.vue'
import { isIconStack } from './is-icon-stack.ts'
import { type Icon } from './types.ts'

defineProps<{
  icon: Icon
  stroke?: string
}>()
</script>
