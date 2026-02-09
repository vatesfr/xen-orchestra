<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.data.id">
    <UiTreeItemLabel icon="object:pool" :route="`/pool/${branch.data.id}`" @toggle="branch.toggleCollapse()">
      {{ branch.data.name_label }}
      <template #addons>
        <UiCounter
          v-tooltip="t('running-vm', runningVmsCount)"
          :value="runningVmsCount"
          accent="brand"
          variant="secondary"
          size="small"
        />
        <MenuList placement="bottom-start">
          <template #trigger="{ open, isOpen }">
            <UiButton
              accent="brand"
              left-icon="action:more-actions"
              variant="tertiary"
              size="small"
              :selected="isOpen"
              @click="open($event)"
            />
          </template>
          <PoolTreeActions :pool="branch.data" />
        </MenuList>
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
import PoolTreeActions from '@/modules/pool/components/actions/PoolTreeActions.vue'
import HostTreeList from '@/modules/treeview/components/HostTreeList.vue'
import VmTreeList from '@/modules/treeview/components/VmTreeList.vue'
import type { HostBranch, PoolBranch, VmLeaf } from '@/modules/treeview/types/tree.type.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { branch } = defineProps<{
  branch: PoolBranch
}>()

const { t } = useI18n()

const { runningVms } = useXoVmCollection()

const treeBranches = computed(() => branch.children.filter(child => child.discriminator === 'host') as HostBranch[])

const vmLeaves = computed(() => branch.children.filter(child => child.discriminator === 'vm') as VmLeaf[])

const runningVmsCount = computed(() =>
  runningVms.value.reduce((vmCount, runningVm) => (runningVm.$pool === branch.data.id ? vmCount + 1 : vmCount), 0)
)
</script>
