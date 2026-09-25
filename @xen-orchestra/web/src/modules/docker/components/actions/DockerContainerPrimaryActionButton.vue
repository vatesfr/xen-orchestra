<template>
  <VtsActionButton
    v-if="primaryAction !== undefined"
    variant="tertiary"
    accent="brand"
    :icon="primaryAction.icon"
    :busy="primaryAction.busy"
    :disabled="primaryAction.disabled"
    @click="primaryAction.run()"
  >
    {{ primaryAction.label }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useDockerContainerActions } from '@/modules/docker/composables/use-docker-container-actions.composable.ts'
import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'

const { container } = defineProps<{
  container: FrontXoDockerContainer
}>()

const emit = defineEmits<{
  changed: []
}>()

const { primaryAction } = useDockerContainerActions(() => container, { onSettled: () => emit('changed') })
</script>
