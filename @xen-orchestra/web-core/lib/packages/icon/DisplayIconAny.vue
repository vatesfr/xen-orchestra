<template>
  <DisplayIconStack v-if="isIconStack(icon)" :stack="icon" />
  <DisplayIconSingle v-else :icon />
</template>

<script lang="ts" setup>
import DisplayIconSingle from './DisplayIconSingle.vue'
import DisplayIconStack from './DisplayIconStack.vue'
import { isIconStack } from './is-icon-stack.ts'
import { type Icon } from './types.ts'

defineProps<{
  icon: Icon
}>()
</script>
