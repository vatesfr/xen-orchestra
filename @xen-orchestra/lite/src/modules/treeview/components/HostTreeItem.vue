<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.dataId" :has-children="branch.hasChildren">
    <UiTreeItemLabel
      :route="{ name: '/host/[uuid]', params: { uuid: branch.data.uuid } }"
      icon="object:host"
      @toggle="branch.toggleCollapse()"
    >
      {{ branch.data.name_label || '(Host)' }}
      <template #addons>
        <UiLoader v-if="isChangingState" v-tooltip="currentOperation" />
        <VtsIcon v-if="isMaster" v-tooltip="t('master')" name="status:primary-circle" size="medium" />
        <UiCounter
          v-tooltip="t('running-vm', { count: runningVmsCount })"
          :value="runningVmsCount"
          accent="brand"
          size="small"
          variant="secondary"
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
          <HostTreeActions :host="branch.data" />
        </MenuList>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import HostTreeActions from '@/modules/host/components/actions/HostTreeActions.vue'
import { useHostUtils } from '@/modules/host/composables/host-utils.composable.ts'
import type { HostBranch } from '@/modules/treeview/types/tree.type.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuList from '@core/components/menu/MenuList.vue'
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

const { isMasterHost } = usePoolStore().subscribe()
const { runningVms } = useVmStore().subscribe()

const { isChangingState, currentOperation } = useHostUtils(() => branch.data)

const isMaster = computed(() => isMasterHost(branch.data.$ref))

const runningVmsCount = computed(() => runningVms.value.filter(vm => vm.resident_on === branch.data.$ref).length)
</script>
