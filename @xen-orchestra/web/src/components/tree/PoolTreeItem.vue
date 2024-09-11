<template>
  <TreeItem :expanded="branch.isExpanded">
    <TreeItemLabel :icon="faCity" :route="`/pool/${branch.data.id}`" @toggle="branch.toggleExpand()">
      {{ branch.data.name_label }}
      <template #addons>
        <UiCounter v-tooltip="$t('running-vm', runningVmsCount)" :value="runningVmsCount" color="primary" />
      </template>
    </TreeItemLabel>
    <template v-if="branch.hasChildren" #sublist>
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
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { HostBranch, PoolBranch, VmLeaf } from '@/types/tree.type'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import UiCounter from '@core/components/UiCounter.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCity } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  branch: PoolBranch
}>()

const { runningVms } = useVmStore().subscribe()

const treeBranches = computed(
  () => props.branch.children.filter(child => child.discriminator === 'host') as HostBranch[]
)

const vmLeaves = computed(() => props.branch.children.filter(child => child.discriminator === 'vm') as VmLeaf[])

const runningVmsCount = computed(() =>
  runningVms.value.reduce((vmCount, runningVm) => (runningVm.$pool === props.branch.data.id ? vmCount + 1 : vmCount), 0)
)
</script>
