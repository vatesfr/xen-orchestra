<template>
  <TitleBar :icon="faDisplay">
    {{ name }}
    <template #actions>
      <AppMenu v-if="vm !== undefined" placement="bottom-end" shadow>
        <template #trigger="{ open, isOpen }">
          <UiButton :active="isOpen" :icon="faPowerOff" @click="open">
            {{ $t('change-state') }}
            <UiIcon :icon="faAngleDown" />
          </UiButton>
        </template>
        <VmActionPowerStateItems :vm-refs="[vm.$ref]" />
      </AppMenu>
      <AppMenu v-if="vm !== undefined" placement="bottom-end" shadow>
        <template #trigger="{ open, isOpen }">
          <UiButton
            v-tooltip="{
              placement: 'left',
              content: $t('more-actions'),
            }"
            :active="isOpen"
            :icon="faEllipsisVertical"
            transparent
            class="more-actions-button"
            @click="open"
          />
        </template>
        <VmActionCopyItem :selected-refs="[vm.$ref]" is-single-action />
        <VmActionExportItem :vm-refs="[vm.$ref]" is-single-action />
        <VmActionSnapshotItem :vm-refs="[vm.$ref]" />
        <VmActionMigrateItem :selected-refs="[vm.$ref]" is-single-action />
      </AppMenu>
    </template>
  </TitleBar>
</template>

<script lang="ts" setup>
import AppMenu from '@/components/menu/AppMenu.vue'
import TitleBar from '@/components/TitleBar.vue'
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import UiButton from '@/components/ui/UiButton.vue'
import VmActionMigrateItem from '@/components/vm/VmActionItems/VmActionMigrateItem.vue'
import VmActionPowerStateItems from '@/components/vm/VmActionItems/VmActionPowerStateItems.vue'
import VmActionSnapshotItem from '@/components/vm/VmActionItems/VmActionSnapshotItem.vue'
import VmActionCopyItem from '@/components/vm/VmActionItems/VmActionCopyItem.vue'
import VmActionExportItem from '@/components/vm/VmActionItems/VmActionExportItem.vue'
import { useVmCollection } from '@/stores/xen-api/vm.store'
import { vTooltip } from '@/directives/tooltip.directive'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import { faAngleDown, faDisplay, faEllipsisVertical, faPowerOff } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const { getByUuid: getVmByUuid } = useVmCollection()
const { currentRoute } = useRouter()

const vm = computed(() => getVmByUuid(currentRoute.value.params.uuid as XenApiVm['uuid']))

const name = computed(() => vm.value?.name_label)
</script>

<style lang="postcss">
.more-actions-button {
  font-size: 1.2em;
}
</style>
