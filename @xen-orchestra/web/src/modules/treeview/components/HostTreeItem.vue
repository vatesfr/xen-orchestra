<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.data.id">
    <UiTreeItemLabel icon="object:host" :route="`/host/${branch.data.id}`" @toggle="branch.toggleCollapse()">
      {{ branch.data.name_label }}
      <template #icon>
        <VtsObjectIcon
          v-tooltip="branch.data.power_state"
          type="host"
          size="medium"
          :state="branch.data.power_state.toLocaleLowerCase() as HostState"
        />
      </template>
      <template #addons>
        <VtsIcon v-if="isMaster" v-tooltip="t('master')" name="status:primary-circle" size="medium" />
        <UiCounter
          v-tooltip="t('running-vm', runningVmsCount)"
          :value="runningVmsCount"
          accent="brand"
          variant="secondary"
          size="small"
        />
        <MenuList placement="bottom-start">
          <template #trigger="{ open, isOpen }">
            <UiButtonIcon
              accent="brand"
              icon="action:more-actions"
              variant="tertiary"
              size="small"
              :selected="isOpen"
              @click="open($event)"
            />
          </template>
          <HostTreeActions :host="branch.data" />
        </MenuList>
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
import HostTreeActions from '@/modules/host/components/actions/HostTreeActions.vue'
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VmTreeList from '@/modules/treeview/components/VmTreeList.vue'
import type { HostBranch } from '@/modules/treeview/types/tree.type.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { HostState } from '@core/types/object-icon.type.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { branch } = defineProps<{
  branch: HostBranch
}>()

const { t } = useI18n()

const { isMasterHost } = useXoHostCollection()
const { runningVms } = useXoVmCollection()

const isMaster = computed(() => isMasterHost(branch.data.id))

const runningVmsCount = computed(() =>
  runningVms.value.reduce((vmCount, runningVm) => (runningVm.$container === branch.data.id ? vmCount + 1 : vmCount), 0)
)
</script>
