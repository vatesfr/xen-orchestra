<template>
  <TreeItem :expanded="branch.isExpanded">
    <TreeItemLabel :icon="faCity" :active :route="`${basePath}/hosts`" @toggle="branch.toggleExpand()">
      {{ branch.data.name_label }}
    </TreeItemLabel>
    <template #sublist>
      <TreeList>
        <HostTreeList :branches="treeBranches" />
        <VmTreeList :leaves="vmLeaves" />
      </TreeList>
    </template>
  </TreeItem>
</template>

<script lang="ts" setup>
import HostTreeList from '@/components/tree/HostTreeList.vue'
import VmTreeList from '@/components/tree/VmTreeList.vue'
import type { HostBranch } from '@/types/host.type'
import type { PoolBranch } from '@/types/pool.type'
import type { VmLeaf } from '@/types/vm.type'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import { faCity } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useRoute } from 'vue-router/auto'

const props = defineProps<{
  branch: PoolBranch
}>()

const treeBranches = computed(
  () => props.branch.children.filter(child => child.discriminator === 'host') as HostBranch[]
)

const vmLeaves = computed(() => props.branch.children.filter(child => child.discriminator === 'vm') as VmLeaf[])

const basePath = computed(() => `/pool/${props.branch.data.id}`)

const route = useRoute()

const active = computed(() => route.path.includes(basePath.value))
</script>
