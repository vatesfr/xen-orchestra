<template>
  <MenuItem v-if="isOffered" :accent="action.accent" :icon="action.icon" :busy="action.busy" :on-click="action.onClick">
    {{ action.label }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { isVmQuarantined, useVdfQuarantine } from '@/modules/vdf/composables/vdf-quarantine.composable.ts'
import { VDF_STATUS_KEY } from '@/modules/vdf/utils/vdf-status.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { computed } from 'vue'

// Quarantine (or release) from a VM's actions menu: offered when an agent
// of its pool reports to XO, or to release it whatever happened since
const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { hosts } = useXoHostCollection()

const { quarantineAction } = useVdfQuarantine()

const isOffered = computed(
  () =>
    isVmQuarantined(vm) ||
    hosts.value.some(host => host.$pool === vm.$pool && host.otherConfig?.[VDF_STATUS_KEY] !== undefined)
)

const action = computed(() => quarantineAction(vm))
</script>
