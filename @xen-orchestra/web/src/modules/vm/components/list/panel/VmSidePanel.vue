<template>
  <VtsSidePanel :has-selection="!!vm" @close="emit('close')">
    <template v-if="vm" #actions>
      <MenuList placement="bottom-start">
        <template #trigger="{ open }">
          <UiDropdownButton @click="open($event)">{{ t('action:change-state') }}</UiDropdownButton>
        </template>
        <VmPowerStateActions :vm />
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
        <VmMoreActions :vm hide-change-state />
      </MenuList>
    </template>
    <template v-if="vm" #default>
      <VmInfoCard :vm />
      <VmNetworkCard :vm />
      <VmResourcesCard :vm />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import VmMoreActions from '@/modules/vm/components/actions/VmMoreActions.vue'
import VmPowerStateActions from '@/modules/vm/components/actions/VmPowerStateActions.vue'
import VmInfoCard from '@/modules/vm/components/list/panel/cards/VmInfoCard.vue'
import VmNetworkCard from '@/modules/vm/components/list/panel/cards/VmNetworkCard.vue'
import VmResourcesCard from '@/modules/vm/components/list/panel/cards/VmResourcesCard.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  vm?: FrontXoVm
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
</script>
