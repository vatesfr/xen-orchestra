<template>
  <VtsTreeItem :expanded="branch.isExpanded">
    <UiTreeItemLabel :icon="faServer" :route="`/host/${branch.data.id}`" @toggle="branch.toggleExpand()">
      {{ branch.data.name_label }}
      <template #icon>
        <UiObjectIcon
          v-tooltip="branch.data.power_state"
          type="host"
          size="medium"
          :state="branch.data.power_state.toLocaleLowerCase() as HostState"
        />
      </template>
      <template #addons>
        <VtsIcon v-if="isMaster" v-tooltip="$t('master')" :icon="faStar" accent="warning" />
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
        <VmTreeList :leaves="branch.children" />
      </VtsTreeList>
    </template>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import VmTreeList from '@/components/tree/VmTreeList.vue'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { HostBranch } from '@/types/tree.type'
import type { HostState } from '@core/types/object-icon.type'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faServer, faStar } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  branch: HostBranch
}>()

const { isMasterHost } = useHostStore().subscribe()
const { runningVms } = useVmStore().subscribe()

const isMaster = computed(() => isMasterHost(props.branch.data.id))

const runningVmsCount = computed(() =>
  runningVms.value.reduce(
    (vmCount, runningVm) => (runningVm.$container === props.branch.data.id ? vmCount + 1 : vmCount),
    0
  )
)
</script>
