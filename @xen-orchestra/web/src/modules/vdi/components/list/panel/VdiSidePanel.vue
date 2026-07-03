<template>
  <VtsSidePanel :has-selection="!!vdi" @close="emit('close')">
    <template #header>
      <div class="action-buttons">
        <template v-if="vbd && vm">
          <VbdConnectButton v-if="!vbd.attached" :vbd :vm />
          <VbdDisconnectButton v-else :vbd :vm />
        </template>
        <MenuList placement="bottom-end">
          <template #trigger="{ open }">
            <UiButtonIcon icon="action:more-actions" accent="brand" size="medium" @click="open($event)" />
          </template>
          <VdiActions :vdi :vbd :vm />
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
    <template v-if="vdi" #more-actions>
      <VdiActions :vdi :vbd :vm />
    </template>
    <template v-if="vdi" #default>
      <VdiInfosCard :vdi :vm />
      <VdiSpaceCard :vdi />
      <VdiConfigurationCard :vdi :vm />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import VbdConnectButton from '@/modules/vbd/components/actions/connect/VbdConnectButton.vue'
import VbdDisconnectButton from '@/modules/vbd/components/actions/disconnect/VbdDisconnectButton.vue'
import { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiActions from '@/modules/vdi/components/actions/VdiActions.vue'
import VdiConfigurationCard from '@/modules/vdi/components/list/panel/cards/VdiConfigurationCard.vue'
import VdiInfosCard from '@/modules/vdi/components/list/panel/cards/VdiInfosCard.vue'
import VdiSpaceCard from '@/modules/vdi/components/list/panel/cards/VdiSpaceCard.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import { useUiStore } from '@core/stores/ui.store'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const uiStore = useUiStore()
const {t} = useI18n()

const { vdi, vm } = defineProps<{
  vdi: FrontXoVdi
  vm?: FrontXoVm
}>()

const emit = defineEmits<{
  close: []
}>()

const { useGetVbdsByIds } = useXoVbdCollection()

const vbds = useGetVbdsByIds(() => vdi?.$VBDs ?? [])

const vbd = computed(() => (vm !== undefined ? vbds.value.find(vbd => vbd.VM === vm.id) : undefined))
</script>
