<template>
  <TitleBar :icon="faDisplay">
    {{ name }}
    <template #actions>
      <MenuList v-if="vm !== undefined" placement="bottom-end">
        <template #trigger="{ open, isOpen }">
          <UiButton
            size="medium"
            accent="info"
            variant="primary"
            :class="{ pressed: isOpen }"
            :left-icon="faPowerOff"
            @click="open"
          >
            {{ $t('change-state') }}
            <UiIcon :icon="faAngleDown" />
          </UiButton>
        </template>
        <VmActionPowerStateItems :vm-refs="[vm.$ref]" />
      </MenuList>
      <MenuList v-if="vm !== undefined" placement="bottom-end">
        <template #trigger="{ open, isOpen }">
          <UiButtonIcon
            v-tooltip="{
              placement: 'left',
              content: $t('more-actions'),
            }"
            :selected="isOpen"
            :icon="faEllipsisVertical"
            accent="info"
            class="more-actions-button"
            size="large"
            @click="open"
          />
        </template>
        <VmActionCopyItem :selected-refs="[vm.$ref]" is-single-action />
        <VmActionExportItem :vm-refs="[vm.$ref]" is-single-action />
        <VmActionSnapshotItem :vm-refs="[vm.$ref]" />
        <VmActionMigrateItem :selected-refs="[vm.$ref]" is-single-action />
      </MenuList>
    </template>
  </TitleBar>
</template>

<script lang="ts" setup>
import TitleBar from '@/components/TitleBar.vue'
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import VmActionCopyItem from '@/components/vm/VmActionItems/VmActionCopyItem.vue'
import VmActionExportItem from '@/components/vm/VmActionItems/VmActionExportItem.vue'
import VmActionMigrateItem from '@/components/vm/VmActionItems/VmActionMigrateItem.vue'
import VmActionPowerStateItems from '@/components/vm/VmActionItems/VmActionPowerStateItems.vue'
import VmActionSnapshotItem from '@/components/vm/VmActionItems/VmActionSnapshotItem.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faAngleDown, faDisplay, faEllipsisVertical, faPowerOff } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const { getByUuid: getVmByUuid } = useVmStore().subscribe()
const { currentRoute } = useRouter()

const vm = computed(() => getVmByUuid(currentRoute.value.params.uuid as XenApiVm['uuid']))

const name = computed(() => vm.value?.name_label)
</script>
