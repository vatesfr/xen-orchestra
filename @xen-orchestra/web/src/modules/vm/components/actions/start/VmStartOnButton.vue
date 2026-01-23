<template>
  <MenuItem v-if="canRunVmOnHost || isRunning" icon="fa:server" :busy="isRunning">
    {{ t('action:start-on-host') }}
    <template #submenu>
      <MenuItem v-for="host in hosts" :key="host.id" @click="startOn(host)">
        <div class="wrapper">
          <VtsObjectIcon type="host" :state="getHostPowerState(host)" size="medium" />
          {{ host.name_label }}
          <div>
            <VtsIcon v-if="isMasterHost(host.id)" name="legacy:primary" size="medium" class="star" />
          </div>
        </div>
      </MenuItem>
    </template>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVmStartOnJob } from '@/modules/vm/jobs/xo-vm-start-on.job.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import { HOST_POWER_STATE, VM_POWER_STATE, type XoHost, type XoVm } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()
const selectedHost = ref<XoHost | undefined>()

const { hostsByPool, isMasterHost } = useXoHostCollection()
const { useGetPoolById } = useXoPoolCollection()

const pool = useGetPoolById(vm.$pool)

const hosts = computed(() => {
  if (!pool.value) {
    return []
  }

  return hostsByPool.value.get(pool.value.id) ?? []
})

const { run, isRunning } = useVmStartOnJob(() => [vm], selectedHost)

// We can't rely on canRun from useVmStartOnJob, because it checks if a host is selected.
const canRunVmOnHost = computed(() => {
  return vm.power_state === VM_POWER_STATE.HALTED
})

function startOn(host: XoHost) {
  selectedHost.value = host
  run()
}

const getHostPowerState = (host: XoHost) => (host ? toLower(host.power_state) : toLower(HOST_POWER_STATE.UNKNOWN))
</script>

<style scoped lang="postcss">
.wrapper {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}
</style>
