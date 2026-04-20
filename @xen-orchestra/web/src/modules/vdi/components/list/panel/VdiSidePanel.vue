<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isSmall }">
    <template #header>
      <div class="action-buttons">
        <VbdConnectButton v-if="!vbd?.attached" :vbd :vm />
        <VbdDisconnectButton v-else :vbd :vm />
        <MenuList placement="bottom-end">
          <template #trigger="{ open }">
            <UiButtonIcon icon="action:more-actions" accent="brand" size="medium" @click="open($event)" />
          </template>
          <VdiActions :vdi :vbd />
        </MenuList>
      </div>
      <div :class="{ 'close-button': uiStore.isSmall }">
        <UiButtonIcon
          v-tooltip="t('action:close')"
          size="small"
          variant="tertiary"
          accent="brand"
          :icon="uiStore.isSmall ? 'fa:angle-left' : 'fa:close'"
          @click="emit('close')"
        />
      </div>
    </template>
    <template #default>
      <VdiInfosCard :vdi :vm />
      <VdiSpaceCard :vdi />
      <VdiConfigurationCard :vdi />
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import VbdConnectButton from '@/modules/vbd/components/actions/VbdConnectButton.vue'
import VbdDisconnectButton from '@/modules/vbd/components/actions/VbdDisconnectButton.vue'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiActions from '@/modules/vdi/components/actions/VdiActions.vue'
import VdiConfigurationCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationCard.vue'
import VdiInfosCard from '@/modules/vdi/components/list/panel/cards/VdiInfosCard.vue'
import VdiSpaceCard from '@/modules/vdi/components/list/panel/cards/VdiSpaceCard.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vm } = defineProps<{
  vdi: FrontXoVdi
  vm: FrontXoVm
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const { useGetVbdsByIds } = useXoVbdCollection()

const vbd = computed(() => useGetVbdsByIds(vdi.$VBDs).value.find(vbd => vbd.VDI === vdi.id))
</script>

<style scoped lang="postcss">
.action-buttons {
  display: flex;
  align-items: center;
  margin-inline-end: auto;
}

.mobile-drawer {
  position: fixed;
  inset: 0;

  .close-button {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
