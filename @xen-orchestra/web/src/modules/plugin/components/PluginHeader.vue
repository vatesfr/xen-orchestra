<template>
  <PluginBreadcrumbLink :plugin />
  <PluginHeaderBar :plugin />
</template>

<script lang="ts" setup>
import PluginBreadcrumbLink from '@/modules/plugin/components/header/PluginBreadcrumbLink.vue'
import PluginHeaderBar from '@/modules/plugin/components/header/PluginHeaderBar.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'

defineProps<{
  plugin: FrontXoPlugin
}>()
</script>
