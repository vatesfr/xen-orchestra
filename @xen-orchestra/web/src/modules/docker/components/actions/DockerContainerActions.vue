<template>
  <VtsActionItems :actions="dockerContainerActionItems" />
</template>

<script lang="ts" setup>
import { useDockerContainerActions } from '@/modules/docker/composables/use-docker-container-actions.composable.ts'
import type { FrontXoDockerContainer } from '@/modules/docker/types/docker.type.ts'
import VtsActionItems from '@core/components/menu/VtsActionItems.vue'

const { container } = defineProps<{
  container: FrontXoDockerContainer
}>()

const emit = defineEmits<{
  changed: []
}>()

const { dockerContainerActionItems } = useDockerContainerActions(() => container, { onSettled: () => emit('changed') })
</script>
