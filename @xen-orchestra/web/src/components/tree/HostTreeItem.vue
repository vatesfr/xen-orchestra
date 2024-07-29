<template>
  <TreeItem :expanded="branch.isExpanded">
    <TreeItemLabel :icon="faServer" :route="`/host/${branch.data.id}`" @toggle="branch.toggleExpand()">
      {{ branch.data.name_label }}
      <template #icon>
        <ObjectIcon
          v-tooltip="branch.data.power_state"
          type="host"
          :state="branch.data.power_state.toLocaleLowerCase() as HostState"
        />
      </template>
      <template #addons>
        <UiIcon v-if="isMaster" v-tooltip="$t('master')" :icon="faStar" color="warning" />
        <UiCounter v-tooltip="$t('vm-running', runningVmsCount)" :value="runningVmsCount" color="info" />
      </template>
    </TreeItemLabel>
    <template v-if="branch.hasChildren" #sublist>
      <TreeList>
        <VmTreeList :leaves="branch.children" />
      </TreeList>
    </template>
  </TreeItem>
</template>

<script lang="ts" setup>
import VmTreeList from '@/components/tree/VmTreeList.vue'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { HostBranch } from '@/types/tree.type'
import type { HostState } from '@core/types/object-icon.type'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import UiIcon from '@core/components/icon/UiIcon.vue'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import TreeList from '@core/components/tree/TreeList.vue'
import UiCounter from '@core/components/UiCounter.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faServer, faStar } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  branch: HostBranch
}>()

const { isMasterHost } = useHostStore().subscribe()
const { runningVms } = useVmStore().subscribe()

const isMaster = computed(() => isMasterHost(props.branch.data.id))

const runningVmsCount = computed(
  () => runningVms.value.filter(runningVm => runningVm.$container === props.branch.data.id).length
)
</script>
