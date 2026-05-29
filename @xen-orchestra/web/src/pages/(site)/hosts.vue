<template>
  <VtsContentSidePanel class="hosts">
    <UiCard class="container">
      <HostsTable :hosts :busy="!areHostsReady" :error="hasHostFetchError" />
    </UiCard>
    <HostSidePanel :host="selectedHost" @close="selectedHost = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import HostsTable from '@/modules/host/components/list/HostsTable.vue'
import HostSidePanel from '@/modules/host/components/list/panel/HostSidePanel.vue'
import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'

const { hosts, getHostById, hasHostFetchError, areHostsReady } = useXoHostCollection()

const selectedHost = useRouteQuery<FrontXoHost | undefined>('id', {
  toData: id => getHostById(id as FrontXoHost['id']),
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
