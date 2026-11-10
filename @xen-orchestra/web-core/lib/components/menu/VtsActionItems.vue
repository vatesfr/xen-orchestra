<template>
  <template v-for="(action, index) of actions" :key="index">
    <MenuSeparator v-if="action.separator" />
    <MenuItem
      :icon="action.icon"
      :disabled="action.disabled"
      :busy="action.busy"
      :accent="action.accent ?? 'neutral'"
      :on-click="action.onClick"
    >
      {{ action.label }}
      <i v-if="action.hint" class="em-dash-prefix">{{ action.hint }}</i>
      <template v-if="action.children" #submenu>
        <VtsActionItems :actions="action.children" />
      </template>
    </MenuItem>
  </template>
</template>

<script setup lang="ts">
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'

defineProps<{
  actions: ActionItem[]
}>()
</script>
