<template>
  <div class="breadcrumb-container">
    <UiBreadcrumb :size>
      <UiLink v-if="vm" :size :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }">
        <VtsObjectIcon type="vm" :state="vmPowerState" size="current" />
        {{ vm.name_label }}
      </UiLink>
      <UiLink v-if="vm" :size :to="{ name: '/vm/[id]/vdis', params: { id: vm.id } }">
        {{ t('vdis') }}
      </UiLink>
      <span v-if="vdi">
        {{ vdi.name_label }}
      </span>
    </UiBreadcrumb>
  </div>
  <UiHeadBar>
    {{ vdi.name_label }}
    <template #icon>
      <VtsObjectIcon
        v-tooltip="{
          placement: 'top',
          content: currentOperation ? currentOperation : '',
        }"
        size="medium"
        :state="toLower(vm.power_state)"
        type="vm"
        :busy="isChangingState"
      />
    </template>
    <template #actions>
      <MenuList placement="bottom-end">
        <template #trigger="{ open }">
          <UiDropdownButton @click="open($event)">{{ t('action:change-state') }}</UiDropdownButton>
        </template>
        <VdiPowerStateActions :vm :vbd />
      </MenuList>
      <MenuList placement="bottom-end">
        <template #trigger="{ open }">
          <UiButtonIcon
            v-tooltip="{
              placement: 'left',
              content: t('more-actions'),
            }"
            icon="action:more-actions"
            accent="brand"
            size="medium"
            @click="open($event)"
          />
        </template>
        <VdiMoreActions :vm :vdi :vbd />
      </MenuList>
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.js'
import VdiMoreActions from '@/modules/vdi/components/VdiMoreActions.vue'
import VdiPowerStateActions from '@/modules/vdi/components/VdiPowerStateActions.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.js'
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.js'
import UiBreadcrumb from '@core/components/ui/breadcrumb/UiBreadcrumb.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import MenuList from '@xen-orchestra/web-core/components/menu/MenuList.vue'
import VtsObjectIcon from '@xen-orchestra/web-core/components/object-icon/VtsObjectIcon.vue'
import UiButtonIcon from '@xen-orchestra/web-core/components/ui/button-icon/UiButtonIcon.vue'
import UiDropdownButton from '@xen-orchestra/web-core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiHeadBar from '@xen-orchestra/web-core/components/ui/head-bar/UiHeadBar.vue'
import { vTooltip } from '@xen-orchestra/web-core/directives/tooltip.directive.ts'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vm, vbd } = defineProps<{ vdi: FrontXoVdi; vm: FrontXoVm; vbd: FrontXoVbd }>()

const uiStore = useUiStore()

const { t } = useI18n()

const { isChangingState, currentOperation } = useXoVmUtils(() => vm)

const size = computed(() => (uiStore.isSmall ? 'small' : 'medium'))
const vmPowerState = computed(() => toLower(vm.power_state))
</script>

<style lang="postcss" scoped>
.breadcrumb-container {
  min-height: 5.6rem;
  padding: 1.2rem 1.6rem;
  display: flex;
  gap: 1.6rem;
  align-items: center;
  border-bottom: 0.1rem solid var(--color-neutral-border);
  background-color: var(--color-neutral-background-primary);
  justify-content: space-between;
  overflow-y: auto;
}
</style>
