<template>
  <MenuList :placement>
    <template #trigger="{ open }">
      <UiButtonIcon
        v-tooltip="{
          placement: 'top',
          content: t('quick-actions'),
        }"
        icon="action:more-actions"
        accent="brand"
        :size
        @click="open($event)"
      />
    </template>
    <VmTreeActions :vm />
  </MenuList>
</template>

<script lang="ts" setup>
import VmTreeActions from '@/modules/vm/components/actions/VmTreeActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ButtonIconSize } from '@core/components/ui/button-icon/UiButtonIcon.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { Options } from 'placement.js'
import { useI18n } from 'vue-i18n'

const { size = 'small', placement = 'bottom-start' } = defineProps<{
  vm: FrontXoVm
  size?: ButtonIconSize
  placement?: Options['placement']
}>()

const { t } = useI18n()
</script>
