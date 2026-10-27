<template>
  <UiButton
    v-for="{ action, variant } of buttons"
    :key="variant"
    v-tooltip="action.hint ?? false"
    size="medium"
    :variant
    accent="brand"
    :disabled="action.disabled"
    :left-icon="action.icon"
    :busy="action.busy"
    @click="action.onClick()"
  >
    {{ action.label }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'

const { plugin } = defineProps<{
  plugin: FrontXoPlugin
}>()

const { configureAction, loadAction } = useXoPluginActions(() => plugin)

const buttons = computed(() => [
  { action: configureAction.value, variant: 'primary' as const },
  { action: loadAction.value, variant: 'tertiary' as const },
])
</script>
