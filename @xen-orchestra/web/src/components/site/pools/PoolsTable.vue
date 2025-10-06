<template>
  <div class="pools-table">
    <UiTitle>
      {{ t('pools') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
        <UiTableActions :title="t('table-actions')">
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:square-caret-down"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('change-state') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:edit"
            variant="tertiary"
            accent="brand"
            size="medium"
          >
            {{ t('edit') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            left-icon="fa:eraser"
            variant="tertiary"
            accent="danger"
            size="medium"
          >
            {{ t('forget') }}
          </UiButton>
        </UiTableActions>
      </div>
      <ServerTable />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoServerCollection } from '@/remote-resources/use-xo-server-collection.ts'
import type { XoServer } from '@/types/xo/server.type.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { icon } from '@core/icons'
import { useServerTable } from '@core/tables/use-server-table'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { servers } = defineProps<{
  servers: XoServer[]
}>()

const { t } = useI18n()

const { areServersReady, hasServerFetchError } = useXoServerCollection()
const { getHostById } = useXoHostCollection()

const searchQuery = ref('')

const filteredServers = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return servers
  }

  return servers.filter(server =>
    Object.values(server).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const getPoolInfo = (server: XoServer) => {
  if (server.poolNameLabel) {
    return {
      label: server.poolNameLabel,
      route: server.poolId ? `/pool/${server.poolId}/dashboard` : undefined,
      icon: icon('fa:city'),
    }
  }

  if (server.poolId) {
    return {
      label: server.poolId,
      route: `/pool/${server.poolId}/dashboard`,
      icon: icon('fa:city'),
    }
  }

  return {
    label: '',
    route: undefined,
    icon: undefined,
  }
}

const getPrimaryHostObjectLinkConfig = (server: XoServer) => {
  const masterHost = getHostById(server.master)

  return masterHost ? { label: masterHost.name_label, route: `/host/${masterHost.id}/dashboard` } : undefined
}

const ServerTable = useServerTable(filteredServers, {
  ready: areServersReady,
  error: hasServerFetchError,
  empty: computed(() => (filteredServers.value.length > 0 ? false : searchQuery.value ? t('no-result') : true)),
  transform: server => ({
    ...getPoolInfo(server),
    status: server.error ? 'unable-to-connect-to-the-pool' : server.status,
    primaryHost: getPrimaryHostObjectLinkConfig(server),
  }),
})
</script>

<style scoped lang="postcss">
.pools-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.pools-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
