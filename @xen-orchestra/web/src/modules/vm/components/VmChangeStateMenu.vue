<template>
  <MenuList placement="bottom-end">
    <template #trigger="{ open }">
      <UiDropdownButton @click="open($event)">
        {{ t('action:change-state') }}
      </UiDropdownButton>
    </template>
    <MenuItem
      v-for="(action, index) of changeStateActions"
      :key="index"
      :icon="action.icon"
      :disabled="action.disabled"
      :busy="action.busy"
      :on-click="action.onClick"
      :class="action.class"
    >
      {{ action.label }}
      <i v-if="action.hint">{{ action.hint }}</i>
    </MenuItem>
  </MenuList>
</template>

<script setup lang="ts">
import { useVmRowActions, type VmActionName } from '@/modules/vm/composables/use-vm-row-actions.composable.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()
const { getVmById } = useXoVmCollection()
const vm = computed(() => getVmById(props.vm.id) ?? props.vm)

const { actions } = useVmRowActions(vm)

const changeStateNames: VmActionName[] = [
  'start',
  'resume',
  'unpause',
  'pause',
  'suspend',
  'reboot',
  'forceReboot',
  'shutdown',
  'forceShutdown',
]

const changeStateActions = computed(() =>
  actions.value.filter(action => action.name !== undefined && changeStateNames.includes(action.name))
)
</script>
