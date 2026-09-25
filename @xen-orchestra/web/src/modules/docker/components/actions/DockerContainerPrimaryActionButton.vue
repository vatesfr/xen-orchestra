<template>
  <UiButton
    v-if="primaryAction !== undefined"
    size="medium"
    variant="tertiary"
    accent="brand"
    :left-icon="primaryAction.icon"
    :busy="primaryAction.busy"
    :disabled="primaryAction.disabled"
    @click="primaryAction.run()"
  >
    {{ primaryAction.label }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useDockerContainerActions } from '@/modules/docker/composables/use-docker-container-actions.composable.ts'
import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'

const { container } = defineProps<{
  container: FrontXoDockerContainer
}>()

const emit = defineEmits<{
  changed: []
}>()

const { primaryAction } = useDockerContainerActions(() => container, { onSettled: () => emit('changed') })
</script>
