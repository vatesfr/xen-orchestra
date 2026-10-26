<template>
  <UiButton
    v-tooltip="loadAction.hint ?? false"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="loadAction.disabled"
    :left-icon="loadAction.icon"
    :busy="loadAction.busy"
    @click="loadAction.onClick()"
  >
    {{ loadAction.label }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'

const { plugin } = defineProps<{
  plugin: FrontXoPlugin
}>()

const { loadAction } = useXoPluginActions(() => plugin)
</script>
