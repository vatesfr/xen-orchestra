<template>
  <VtsTreeItem :expanded="branch.isExpanded">
    <UiTreeItemLabel :icon="faCity" :route="`/pool/${branch.data.id}`" @toggle="branch.toggleExpand()">
      {{ branch.data.name_label }}
      <template #addons>
        <UiCounter
          v-tooltip="$t('running-vm', runningVmsCount)"
          :value="runningVmsCount"
          accent="brand"
          variant="secondary"
          size="small"
        />
      </template>
    </UiTreeItemLabel>
    <template v-if="branch.hasChildren" #sublist>
      <VtsTreeList>
        <HostTreeList :branches="treeBranches" />
        <VmTreeList :leaves="vmLeaves" />
      </VtsTreeList>
    </template>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import HostTreeList from '@/components/tree/HostTreeList.vue'
import VmTreeList from '@/components/tree/VmTreeList.vue'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { HostBranch, PoolBranch, VmLeaf } from '@/types/tree.type'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
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
