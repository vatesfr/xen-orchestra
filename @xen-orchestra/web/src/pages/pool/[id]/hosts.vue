<template>
  <VtsContentSidePanel class="hosts">
    <UiCard class="container">
      <HostsTable :hosts :busy="!areHostsReady" :error="hasHostFetchError" />
    </UiCard>
    <HostSidePanel :host="selectedHost" @close="selectedHost = undefined" />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import HostsTable from '@/modules/host/components/list/HostsTable.vue'
import HostSidePanel from '@/modules/host/components/list/panel/HostSidePanel.vue'
import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { computed } from 'vue'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { areHostsReady, hostsByPool, hasHostFetchError } = useXoHostCollection()

const hosts = computed(() => hostsByPool.value.get(pool.id) ?? [])

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
