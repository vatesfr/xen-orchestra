<template>
  <PluginChangeStateButton :plugin />
  <VtsActionsMenu size="medium">
    <PluginAutoloadButton :plugin />
  </VtsActionsMenu>
</template>

<script lang="ts" setup>
import PluginAutoloadButton from '@/modules/plugin/components/actions/autoload/PluginAutoloadButton.vue'
import PluginChangeStateButton from '@/modules/plugin/components/actions/change-state/PluginChangeStateButton.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'

defineProps<{
  plugin: FrontXoPlugin
}>()
</script>
