<template>
  <UiHeadBar icon="object:vm">
    {{ vm?.name_label }}
    <template #icon>
      <VtsObjectIcon size="medium" :state="toLower(vm?.power_state)" type="vm" />
    </template>
    <template #actions>
      <MenuList v-if="vm !== undefined" placement="bottom-end">
        <template #trigger="{ open }">
          <UiDropdownButton @click="open($event)">{{ t('action:change-state') }}</UiDropdownButton>
        </template>
        <VmActionPowerStateItems :vm-refs="[vm.$ref]" />
      </MenuList>
      <MenuList v-if="vm !== undefined" placement="bottom-end">
        <template #trigger="{ open }">
          <UiButtonIcon
            v-tooltip="{
              placement: 'left',
              content: t('more-actions'),
            }"
            :selected="isOpen"
            icon="action:more-actions-vertical"
            accent="brand"
            size="medium"
            @click="open($event)"
          />
        </template>
        <VmActionCopyItem :selected-refs="[vm.$ref]" is-single-action />
        <VmActionExportItem :vm-refs="[vm.$ref]" is-single-action />
        <VmActionSnapshotItem :vm-refs="[vm.$ref]" />
        <VmActionMigrateItem :selected-refs="[vm.$ref]" is-single-action />
      </MenuList>
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import VmActionCopyItem from '@/components/vm/VmActionItems/VmActionCopyItem.vue'
import VmActionExportItem from '@/components/vm/VmActionItems/VmActionExportItem.vue'
import VmActionMigrateItem from '@/components/vm/VmActionItems/VmActionMigrateItem.vue'
import VmActionPowerStateItems from '@/components/vm/VmActionItems/VmActionPowerStateItems.vue'
import VmActionSnapshotItem from '@/components/vm/VmActionItems/VmActionSnapshotItem.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()

const { getByUuid: getVmByUuid } = useVmStore().subscribe()
const route = useRoute<'/vm/[uuid]'>()

const vm = computed(() => getVmByUuid(route.params.uuid as XenApiVm['uuid']))
</script>
