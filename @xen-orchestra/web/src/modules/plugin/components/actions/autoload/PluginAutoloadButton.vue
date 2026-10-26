<template>
  <MenuItem
    accent="neutral"
    :icon="autoloadAction.icon"
    :disabled="autoloadAction.disabled"
    :busy="autoloadAction.busy"
    @click="autoloadAction.onClick()"
  >
    {{ autoloadAction.label }}
    <i v-if="autoloadAction.hint" class="em-dash-prefix">{{ autoloadAction.hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'

const { plugin } = defineProps<{
  plugin: FrontXoPlugin
}>()

const { autoloadAction } = useXoPluginActions(() => plugin)
</script>
