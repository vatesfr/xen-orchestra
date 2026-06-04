<template>
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
        <VmMoreActions :vm />
      </MenuList>
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiPowerStateActions from '@/modules/vdi/components/VdiPowerStateActions.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VmMoreActions from '@/modules/vm/components/actions/VmMoreActions.vue'
import { useXoVmUtils } from '@/modules/vm/composables/xo-vm-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { toLower } from 'lodash-es'
import { useI18n } from 'vue-i18n'

const { vdi, vm, vbd } = defineProps<{ vdi: FrontXoVdi; vm: FrontXoVm; vbd: FrontXoVbd }>()

const { t } = useI18n()

const { isChangingState, currentOperation } = useXoVmUtils(() => vm)
</script>
