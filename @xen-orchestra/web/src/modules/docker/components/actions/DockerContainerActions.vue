<template>
  <MenuItem
    v-for="action of dockerContainerActionItems"
    :key="action.label"
    :accent="action.accent ?? 'neutral'"
    :icon="action.icon"
    :disabled="action.disabled"
    :busy="action.busy"
    @click="action.onClick?.()"
  >
    {{ action.label }}
    <i v-if="action.hint">{{ action.hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useDockerContainerActions } from '@/modules/docker/composables/use-docker-container-actions.composable.ts'
import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'

const { container } = defineProps<{
  container: FrontXoDockerContainer
}>()

const emit = defineEmits<{
  changed: []
}>()

const { dockerContainerActionItems } = useDockerContainerActions(() => container, { onSettled: () => emit('changed') })
</script>
