<template>
  <VtsContentSidePanel class="pool-hosts-view">
    <UiCard class="container">
      <HostsTable :hosts :busy="!isReady" :error="hasError" />
    </UiCard>
    <HostSidePanel :host="selectedHost" @close="selectedHost = undefined" />
  </VtsContentSidePanel>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import HostsTable from '@/modules/host/components/list/HostsTable.vue'
import HostSidePanel from '@/modules/host/components/list/panel/HostSidePanel.vue'
import { usePageTitleStore } from '@/stores/page-title.store.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { isReady, hasError, records: hosts } = useHostStore().subscribe()

usePageTitleStore().setTitle(() => t('hosts'))

const selectedHost = useRouteQuery<XenApiHost | undefined>('id', {
  toData: id => hosts.value.find(host => host.uuid === id),
  toQuery: host => host?.uuid ?? '',
})
</script>

<style lang="postcss" scoped>
.pool-hosts-view {
  .container {
    height: fit-content;
    margin: 0.8rem;
    gap: 4rem;
  }
}
</style>
