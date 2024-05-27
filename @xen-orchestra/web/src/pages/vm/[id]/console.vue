<template>
  <DefaultLayout>
    <template #content-header>
      <VmHeader :name="vm?.name_label" :state="vmPowerState" />
    </template>
    <template #content>
      <p v-if="!isVmConsoleAvailable" class="typo h5-medium">{{ $t('power-on-for-console') }}</p>
      <RemoteConsole v-else :id="vm!.id" :url="url!" />
    </template>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import RemoteConsole from '@core/components/console/RemoteConsole.vue'
import VmHeader from '@/components/vm/VmHeader.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { RecordId } from '@/types/xo-object.type'
import type { VmState } from '@core/types/object-icon.type'
import { computed } from 'vue'
import { useRoute } from 'vue-router/auto'

const route = useRoute<'/vm/[id]/console'>()

const { get } = useVmStore().subscribe()

const vm = computed(() => get(route.params.id as RecordId<'VM'>))

const vmPowerState = computed(() =>
  vm.value !== undefined ? (vm.value.power_state.toLocaleLowerCase() as VmState) : undefined
)

const baseUrl = import.meta.env.VITE_XO_REST_BASE_URL

const url = computed(() => {
  if (vm.value === undefined) {
    return
  }

  const _url = new URL(`${baseUrl}/api/consoles/${vm.value.id}`)
  _url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

  return _url
})

const isVmConsoleAvailable = computed(
  () => vmPowerState.value === 'running' && vm?.value?.other.disable_pv_vnc !== '1' && url.value !== undefined
)
</script>
