<template>
  <TitleBar :icon="faDisplay">
    {{ name }}
    <template v-if="vm !== undefined" #actions>
      <UiDropdownButton :icon="faPowerOff" v-bind="omit(powerMenu.$trigger, ['as', 'submenu'])">
        {{ $t('change-state') }}
      </UiDropdownButton>

      <VtsMenuList border v-bind="powerMenu.$target">
        <VmActionPowerStateItems :menu="powerMenu" :vm-refs="[vm.$ref]" />
      </VtsMenuList>

      <UiButtonIcon
        v-tooltip="{
          placement: 'left',
          content: $t('more-actions'),
        }"
        :icon="faEllipsisVertical"
        accent="info"
        class="more-actions-button"
        size="large"
        v-bind="omit(moreMenu.$trigger, ['as', 'submenu'])"
      />

      <VtsMenuList border v-bind="moreMenu.$target">
        <VmActionCopyItem :menu="moreMenu" :selected-refs="[vm.$ref]" is-single-action />
        <VmActionExportItem :menu="moreMenu" :vm-refs="[vm.$ref]" is-single-action />
        <VmActionSnapshotItem :menu="moreMenu" :vm-refs="[vm.$ref]" />
        <VmActionMigrateItem :menu="moreMenu" :selected-refs="[vm.$ref]" is-single-action />
      </VtsMenuList>
    </template>
  </TitleBar>
</template>

<script lang="ts" setup>
import TitleBar from '@/components/TitleBar.vue'
import VmActionCopyItem from '@/components/vm/VmActionItems/VmActionCopyItem.vue'
import VmActionExportItem from '@/components/vm/VmActionItems/VmActionExportItem.vue'
import VmActionMigrateItem from '@/components/vm/VmActionItems/VmActionMigrateItem.vue'
import VmActionPowerStateItems from '@/components/vm/VmActionItems/VmActionPowerStateItems.vue'
import VmActionSnapshotItem from '@/components/vm/VmActionItems/VmActionSnapshotItem.vue'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsMenuList from '@core/components/menu/VtsMenuList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useMenuToggle } from '@core/packages/menu'
import { faDisplay, faEllipsisVertical, faPowerOff } from '@fortawesome/free-solid-svg-icons'
import { objectOmit as omit } from '@vueuse/shared'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const { getByUuid: getVmByUuid } = useVmStore().subscribe()
const { currentRoute } = useRouter()

const vm = computed(() => getVmByUuid(currentRoute.value.params.uuid as XenApiVm['uuid']))

const name = computed(() => vm.value?.name_label)

const powerMenu = useMenuToggle({ placement: 'bottom-end' })

const moreMenu = useMenuToggle({ placement: 'bottom-end' })
</script>
