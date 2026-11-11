<template>
  <VtsTreeItem expanded :node-id="leaf.data.id">
    <UiTreeItemLabel :route :exact-active="active" no-indent>
      {{ label }}
      <template #icon>
        <VtsIcon :name="icon" :tooltip="stateLabel" size="medium" />
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import { useDockerContainerStateLabel } from '@/modules/docker/composables/use-docker-container-state-label.composable.ts'
import { getDockerContainerIcon } from '@/modules/docker/utils/xo-docker-tree.util.ts'
import { getContainerDisplayName } from '@/modules/docker/utils/xo-docker.util.ts'
import type { DockerContainerLeaf } from '@/modules/treeview/types/tree.type.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { leaf } = defineProps<{
  leaf: DockerContainerLeaf
}>()

const currentRoute = useRoute()

const { getDockerContainerStateLabel } = useDockerContainerStateLabel()

const label = computed(() => getContainerDisplayName(leaf.data))

const icon = computed(() => getDockerContainerIcon(leaf.data))

const stateLabel = computed(() => getDockerContainerStateLabel(leaf.data))

const route = computed(() => ({ path: `/vm/${leaf.data.$VM}/containers`, query: { id: leaf.data.id } }))

// `RouterLink` ignores the query: every container of the VM would be active
const active = computed(
  () =>
    currentRoute.name === '/vm/[id]/containers' &&
    currentRoute.params.id === leaf.data.$VM &&
    currentRoute.query.id === leaf.data.id
)
</script>
