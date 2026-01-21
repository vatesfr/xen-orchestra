<template>
  <MenuItem v-if="canRunVmOnHost || isRunning" icon="fa:server" :busy="isRunning">
    {{ t('action:start-on-host') }}
    <template #submenu>
      <MenuItem v-for="host in hosts" :key="host.id" @click="startOn(host)">
        <div class="wrapper">
          <VtsObjectIcon type="host" :state="getHostState(host.power_state)" size="medium" />
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
import { useXoHostUtils } from '@/composables/xo-host.composable.ts'
import { useVmStartOnJob } from '@/jobs/vm/vm-start-on.job.ts'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import { VM_POWER_STATE, type XoHost, type XoVm } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: XoVm
}>()

const { t } = useI18n()
const selectedHost = ref<XoHost | undefined>()

const { hostsByPool, isMasterHost } = useXoHostCollection()
const { useGetPoolById } = useXoPoolCollection()
const { getHostState } = useXoHostUtils()

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
</script>

<style scoped lang="postcss">
.wrapper {
  display: flex;
  gap: 0.8rem;
  align-items: center;
}
</style>
