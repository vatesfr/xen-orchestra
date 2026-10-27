<template>
  <PluginMainActions :plugin />
  <VtsActionsMenu size="medium">
    <PluginMoreActions :plugin />
  </VtsActionsMenu>
</template>

<script lang="ts" setup>
import PluginMainActions from '@/modules/plugin/components/actions/PluginMainActions.vue'
import PluginMoreActions from '@/modules/plugin/components/actions/PluginMoreActions.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'

defineProps<{
  plugin: FrontXoPlugin
}>()
</script>
