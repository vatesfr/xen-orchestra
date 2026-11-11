<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :has-children="hasChildren" :node-id="branch.data.id">
    <UiTreeItemLabel :route="`/vm/${branch.data.vm.id}/containers`" @toggle="branch.toggleCollapse()">
      {{ branch.data.label }}
      <template #icon>
        <VtsIcon :name="icon" :tooltip size="medium" />
      </template>
      <template #addons>
        <UiLoader v-if="isLoading" />
        <UiCounter
          v-else-if="branch.data.containersLoaded && !branch.isCollapsed"
          v-tooltip="t('running-container', runningContainersCount)"
          :value="runningContainersCount"
          accent="brand"
          size="small"
          variant="secondary"
        />
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import { useDockerHostStatus } from '@/modules/docker/composables/use-docker-host-status.composable.ts'
import {
  canListContainers,
  getDockerEngineKindLabel,
  getDockerHostIcon,
} from '@/modules/docker/utils/xo-docker-tree.util.ts'
import type { DockerHostBranch } from '@/modules/treeview/types/tree.type.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { branch } = defineProps<{
  branch: DockerHostBranch
}>()

const { t } = useI18n()

const { getDockerHostStatus } = useDockerHostStatus()

const canList = computed(() => canListContainers(branch.data))

// the arrow is shown before the containers are listed: listing them connects to the engine
const hasChildren = computed(() => canList.value || branch.hasChildren)

const isLoading = computed(() => canList.value && !branch.isCollapsed && !branch.data.containersLoaded)

const icon = computed(() => getDockerHostIcon(branch.data))

const tooltip = computed(() => {
  const { engine } = branch.data
  const parts = [getDockerEngineKindLabel(engine), getDockerHostStatus(branch.data).label]

  if (engine.connectionStatus === 'error' && engine.error !== undefined) {
    parts.push(engine.error.message)
  }

  return parts.filter(part => part !== undefined).join(' – ')
})

const runningContainersCount = computed(
  () => branch.rawChildren.filter(container => container.data.state === 'running').length
)
</script>
