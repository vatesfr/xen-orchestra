<template>
  <VmPowerStateActionButton v-if="!exclude.start" :action="actions.start" />
  <MenuItem accent="neutral" :busy="isStartingOnHost" :disabled="!areVmsHalted" icon="object:host">
    {{ t('action:start-on-host') }}
    <template #submenu>
      <MenuItem
        v-for="host in hosts"
        :key="host.$ref"
        accent="neutral"
        icon="object:host"
        @click="xenApi.vm.startOn(vmRefs, host.$ref)"
      >
        <div class="wrapper">
          {{ host.name_label }}
          <div>
            <VtsIcon v-if="host.$ref === pool?.master" name="status:primary-circle" size="medium" class="star" />
            <PowerStateIcon :state="getHostState(host)" />
          </div>
        </div>
      </MenuItem>
    </template>
  </MenuItem>
  <VmPowerStateActionButton v-for="action in menuActions" :key="action" :action="actions[action]" />
</template>

<script lang="ts" setup>
import PowerStateIcon from '@/components/PowerStateIcon.vue'
import { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiHost, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import VmPowerStateActionButton from '@/modules/vm/components/actions/VmPowerStateActionButton.vue'
import { useVmPowerStateActions } from '@/modules/vm/composables/vm-power-state-actions.composable.ts'
import type { VmPowerStateAction } from '@/modules/vm/utils/vm.util.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmRefs, exclude = {} } = defineProps<{
  vmRefs: XenApiVm['$ref'][]
  exclude?: Partial<Record<VmPowerStateAction, boolean>>
}>()

const { t } = useI18n()

const { records: hosts } = useHostStore().subscribe()
const { pool } = usePoolStore().subscribe()
const { isHostRunning } = useHostMetricsStore().subscribe()

const xenApi = useXenApiStore().getXapi()

const MENU_ACTIONS: VmPowerStateAction[] = [
  'pause',
  'suspend',
  'resume',
  'reboot',
  'force-reboot',
  'shutdown',
  'force-shutdown',
]

const { actions, areVmsHalted, isStartingOnHost } = useVmPowerStateActions(() => vmRefs)

const menuActions = computed(() => MENU_ACTIONS.filter(action => !exclude[action]))

const getHostState = (host: XenApiHost) => (isHostRunning(host) ? VM_POWER_STATE.RUNNING : VM_POWER_STATE.HALTED)
</script>

<style lang="postcss" scoped>
.wrapper {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.star {
  margin: 0 1rem;
}
</style>
