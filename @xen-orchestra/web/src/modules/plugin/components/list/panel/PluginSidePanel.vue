<template>
  <VtsSidePanel :has-selection="!!plugin" @close="emit('close')">
    <template v-if="plugin" #actions>
      <PluginChangeStateButton :plugin />
    </template>
    <template v-if="plugin" #more-actions>
      <PluginAutoloadButton :plugin />
    </template>
    <template v-if="plugin" #default>
      <PluginInfosCard :key="plugin.id" :plugin />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import PluginAutoloadButton from '@/modules/plugin/components/actions/autoload/PluginAutoloadButton.vue'
import PluginChangeStateButton from '@/modules/plugin/components/actions/change-state/PluginChangeStateButton.vue'
import PluginInfosCard from '@/modules/plugin/components/list/panel/cards/PluginInfosCard.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

defineProps<{
  plugin?: FrontXoPlugin
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
