<template>
  <VtsMobileMenu v-if="uiStore.isSmall" :title :section-title @action="emit('action')">
    <template #trigger="{ open, isOpen }">
      <slot :is-open :open="() => open()" name="trigger" />
    </template>
    <slot />
  </VtsMobileMenu>
  <MenuList v-else :placement>
    <template #trigger="{ open, isOpen }">
      <slot :is-open :open name="trigger" />
    </template>
    <slot />
  </MenuList>
</template>

<script lang="ts" setup>
import MenuList from '@core/components/menu/MenuList.vue'
import VtsMobileMenu from '@core/components/menu/VtsMobileMenu.vue'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import type { Options } from 'placement.js'

const { title, sectionTitle, placement, disabled } = defineProps<{
  title: string
  sectionTitle?: string
  placement?: Options['placement']
  disabled?: boolean
}>()

const emit = defineEmits<{
  action: []
}>()

defineSlots<{
  default(): any
  trigger(props: { open: (event: MouseEvent) => void; isOpen: boolean }): any
}>()

const uiStore = useUiStore()

useDisabled(() => disabled)
</script>
