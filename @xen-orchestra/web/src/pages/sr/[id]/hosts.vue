<template>
  <VtsContentSidePanel class="hosts">
    <UiCard class="container">
      <HostsTable :hosts :busy="!isReady" :error="hasError" :get-connection-status="getHostConnectionStatus" />
    </UiCard>
    <HostSidePanel :host="selectedHost" @close="selectedHost = undefined" />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import HostsTable from '@/modules/host/components/list/HostsTable.vue'
import HostSidePanel from '@/modules/host/components/list/panel/HostSidePanel.vue'
import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { useGetPbdsInScope } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { SR_SCOPE_TYPE } from '@core/types/storage-repository.type.ts'
import { logicAnd, logicOr } from '@vueuse/math'
import { computed } from 'vue'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { getHostById, areHostsReady, hasHostFetchError } = useXoHostCollection()
const { pbdsBySr, arePbdsReady, hasPbdFetchError } = useXoPbdCollection()

const isReady = logicAnd(areHostsReady, arePbdsReady)
const hasError = logicOr(hasHostFetchError, hasPbdFetchError)

const hosts = computed(() =>
  (pbdsBySr.value.get(sr.id) ?? [])
    .map(pbd => getHostById(pbd.host))
    .filter((host): host is FrontXoHost => host !== undefined)
)

const { getConnectionStatusInScope } = useGetPbdsInScope()

const getHostConnectionStatus = (host: FrontXoHost) =>
  getConnectionStatusInScope(sr, { type: SR_SCOPE_TYPE.HOST, hostId: host.id })

const selectedHost = useRouteQuery<FrontXoHost | undefined>('id', {
  toData: id => hosts.value.find(host => host.id === id),
  toQuery: host => host?.id ?? '',
})
</script>

<style scoped lang="postcss">
.hosts {
  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
