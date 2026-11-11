<template>
  <VtsTreeItem expanded :node-id="leaf.data.id">
    <UiTreeItemLabel :route :active no-indent>
      {{ getContainerDisplayName(leaf.data) }}
      <template #icon>
        <VtsIcon
          :name="getDockerContainerIcon(leaf.data)"
          :tooltip="getDockerContainerStateLabel(leaf.data)"
          size="medium"
        />
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

const path = computed(() => `/vm/${leaf.data.$VM}/containers`)

const route = computed(() => ({ path: path.value, query: { id: leaf.data.id } }))

// `RouterLink` ignores the query: every container of the VM would be active
const active = computed(() => currentRoute.path === path.value && currentRoute.query.id === leaf.data.id)
</script>
