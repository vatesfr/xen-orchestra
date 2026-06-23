<template>
  <UiHeadBar>
    {{ vdi.name_label }}
    <template #icon>
      <VtsIcon v-if="vbds" size="medium" :name="getVdiIcon(vbds)" />
    </template>
    <template #actions>
      <VdiPowerStateActions :vm :vbd />
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

<script setup lang="ts">
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiMoreActions from '@/modules/vdi/components/actions/VdiMoreActions.vue'
import VdiPowerStateActions from '@/modules/vdi/components/actions/VdiPowerStateActions.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { getVdiIcon } from '@/modules/vdi/utils/xo-vdi.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useI18n } from 'vue-i18n'

const { vdi, vm, vbds, vbd } = defineProps<{
  vdi: FrontXoVdi
  vm?: FrontXoVm
  vbds?: FrontXoVbd[]
  vbd?: FrontXoVbd
}>()

const { t } = useI18n()
</script>
