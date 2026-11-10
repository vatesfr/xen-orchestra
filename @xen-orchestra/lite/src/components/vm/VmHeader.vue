<template>
  <UiHeadBar icon="object:vm">
    {{ vm?.name_label }}
    <template #icon>
      <VtsObjectIcon
        size="medium"
        :state="toLower(vm?.power_state)"
        type="vm"
        :busy="isChangingState"
        :busy-tooltip="currentOperation"
      />
    </template>
    <template #actions>
      <VtsChangeStateMenu v-if="vm !== undefined && !uiStore.isSmall" placement="bottom-start">
        <VmActionPowerStateItems :vm-refs="[vm.$ref]" />
      </VtsChangeStateMenu>
      <VtsActionsMenu v-if="vm !== undefined" :label="t('more-actions')" size="medium">
        <VtsChangeStateMenuItem v-if="uiStore.isSmall">
          <VmActionPowerStateItems :vm-refs="[vm.$ref]" />
        </VtsChangeStateMenuItem>
        <VmActionCopyItem :selected-refs="[vm.$ref]" is-single-action />
        <VmActionExportItem :vm-refs="[vm.$ref]" is-single-action />
        <VmActionSnapshotItem :vm-refs="[vm.$ref]" />
        <VmActionMigrateItem :selected-refs="[vm.$ref]" is-single-action />
      </VtsActionsMenu>
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import VmActionCopyItem from '@/components/vm/VmActionItems/VmActionCopyItem.vue'
import VmActionExportItem from '@/components/vm/VmActionItems/VmActionExportItem.vue'
import VmActionMigrateItem from '@/components/vm/VmActionItems/VmActionMigrateItem.vue'
import VmActionPowerStateItems from '@/components/vm/VmActionItems/VmActionPowerStateItems.vue'
import VmActionSnapshotItem from '@/components/vm/VmActionItems/VmActionSnapshotItem.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { useVmOperation } from '@/modules/vm/composables/vm-operation.composable.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import VtsChangeStateMenu from '@core/components/menu/VtsChangeStateMenu.vue'
import VtsChangeStateMenuItem from '@core/components/menu/VtsChangeStateMenuItem.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

const uiStore = useUiStore()

const { getByUuid: getVmByUuid } = useVmStore().subscribe()
const route = useRoute<'/vm/[uuid]'>()

const vm = computed(() => getVmByUuid(route.params.uuid as XenApiVm['uuid']))

const { isChangingState, currentOperation } = useVmOperation(vm)
</script>
