<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :has-children="branch.hasChildren" :node-id="branch.data.id">
    <UiTreeItemLabel :route="`/host/${branch.data.id}`" icon="object:host" @toggle="branch.toggleCollapse()">
      {{ branch.data.name_label }}
      <template #icon>
        <VtsIcon :name="hostIcon" :tooltip="hostIconTooltip" size="medium" />
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
          size="small"
          variant="secondary"
        />
        <VtsActionsMenu placement="bottom-start">
          <HostMoreActions :host="branch.data" show-change-state />
        </VtsActionsMenu>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import HostMoreActions from '@/modules/host/components/HostMoreActions.vue'
import { useXoHostUtils } from '@/modules/host/composables/xo-host-utils.composable.ts'
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { getHostIcon, getHostState } from '@/modules/host/utils/xo-host.util.ts'
import type { HostBranch } from '@/modules/treeview/types/tree.type.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
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

const { getHostStateDisplay, isChangingState, currentOperation, iconTooltip } = useXoHostUtils(() => branch.data)

const isMaster = computed(() => isMasterHost(branch.data.id))
const hostIcon = computed(() => getHostIcon(branch.data))

const hostIconTooltip = computed(() => iconTooltip.value || getHostStateDisplay(getHostState(branch.data)).text)

const runningVmsCount = computed(() => runningVmsCountByContainer.value.get(branch.data.id) ?? 0)
</script>
