<template>
  <MenuItem v-if="canRunVmOnHost || isRunning" icon="object:host" :busy="isRunning">
    {{ t('action:start-on-host') }}
    <template #submenu>
      <MenuItem v-for="host in hosts" :key="host.id" @click="startOn(host)">
        <VmStartOnHostState :host />
      </MenuItem>
    </template>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VmStartOnHostState from '@/modules/vm/components/actions/start/VmStartOnHostState.vue'
import { useXoVmStartOnJob } from '@/modules/vm/jobs/xo-vm-start-on.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'

import { VM_POWER_STATE } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()
const selectedHost = ref<FrontXoHost | undefined>()

const { hostsByPool } = useXoHostCollection()
const { useGetPoolById } = useXoPoolCollection()

const pool = useGetPoolById(vm.$pool)

const hosts = computed(() => {
  if (!pool.value) {
    return []
  }

  return hostsByPool.value.get(pool.value.id) ?? []
})

const { run, isRunning } = useXoVmStartOnJob(() => [vm], selectedHost)

// We can't rely on canRun from useVmStartOnJob, because it checks if a host is selected.
const canRunVmOnHost = computed(() => {
  return vm.power_state === VM_POWER_STATE.HALTED
})

function startOn(host: FrontXoHost) {
  selectedHost.value = host
  run()
}
</script>
