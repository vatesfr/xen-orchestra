<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.data.id" :has-children="branch.hasChildren">
    <UiTreeItemLabel icon="object:host" :route="`/host/${branch.data.id}`" @toggle="branch.toggleCollapse()">
      {{ branch.data.name_label }}
      <template #icon>
        <VtsObjectIcon
          v-tooltip="getHostState(branch.data)"
          type="host"
          size="medium"
          :state="getHostState(branch.data)"
        />
      </template>
      <template #addons>
        <UiLoader
          v-if="isChangingState"
          v-tooltip="{
            placement: 'top',
            content: currentOperation,
          }"
        />
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
              size="small"
              :selected="isOpen"
              @click="open($event)"
            />
          </template>
          <HostMoreActions :host="branch.data" show-change-state-button />
        </MenuList>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import HostMoreActions from '@/modules/host/components/HostMoreActions.vue'
import { useXoHostUtils } from '@/modules/host/composables/xo-host-utils.composable.ts'
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostState } from '@/modules/host/utils/xo-host.util.ts'
import type { HostBranch } from '@/modules/treeview/types/tree.type.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { branch } = defineProps<{
  branch: HostBranch
}>()

const { t } = useI18n()

const { isMasterHost } = useXoHostCollection()
const { runningVmsCountByContainer } = useXoVmCollection()

const { isChangingState, currentOperation } = useXoHostUtils(() => branch.data)

const isMaster = computed(() => isMasterHost(branch.data.id))

const runningVmsCount = computed(() => runningVmsCountByContainer.value.get(branch.data.id) ?? 0)
</script>
