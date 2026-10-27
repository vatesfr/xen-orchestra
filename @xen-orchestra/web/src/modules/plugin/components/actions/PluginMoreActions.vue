<template>
  <VtsActionItems :actions="moreActions" />
</template>

<script lang="ts" setup>
import { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import VtsActionItems from '@core/components/menu/VtsActionItems.vue'

const { plugin } = defineProps<{
  plugin: FrontXoPlugin
}>()

const { moreActions } = useXoPluginActions(() => plugin)
</script>
