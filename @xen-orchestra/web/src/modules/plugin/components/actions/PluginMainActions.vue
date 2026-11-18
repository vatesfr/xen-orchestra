<template>
  <VtsActionButton
    v-for="{ action, variant } of buttons"
    :key="variant"
    :hint="action.hint"
    :variant
    accent="brand"
    :disabled="action.disabled"
    :icon="action.icon"
    :busy="action.busy"
    @click="action.onClick()"
  >
    {{ action.label }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useXoPluginActions } from '@/modules/plugin/composables/use-xo-plugin-actions.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
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
