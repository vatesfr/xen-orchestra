<template>
  <div class="clusters-table">
    <UiTitle>{{ t('clusters') }}</UiTitle>
    <VtsQueryBuilder v-model="filter" :schema />
    <div class="container">
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <HeadCells />
        </thead>
        <tbody>
          <VtsRow v-for="cluster of paginatedClusters" :key="cluster.id" :selected="selectedClusterId === cluster.id">
            <BodyCells :item="cluster" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { kubernetesClusterPhaseToStatus } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { getKubernetesClusterRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import { kubernetesTagsToDisplayStrings } from '@/modules/kubernetes/utils/kubernetes-tags.util.ts'
import VtsQueryBuilder from '@core/components/query-builder/VtsQueryBuilder.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { icon } from '@core/icons'
import { useQueryBuilderSchema } from '@core/packages/query-builder/schema/use-query-builder-schema.ts'
import { useQueryBuilderFilter } from '@core/packages/query-builder/use-query-builder-filter.ts'
import { useClusterColumns } from '@core/tables/column-sets/cluster-columns.ts'
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { useI18n } from 'vue-i18n'

const {
  clusters: rawClusters,
  busy,
  error,
} = defineProps<{
  clusters: XoKubernetesCluster[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const selectedClusterId = useRouteQuery('id')

const { items: filteredClusters, filter } = useQueryBuilderFilter('kubernetes-clusters', () => rawClusters)

const schema = useQueryBuilderSchema<XoKubernetesCluster>({
  '': useStringSchema(t('any-property')),
  name: useStringSchema(t('name')),
  phase: useStringSchema(t('status')),
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    rawClusters.length === 0
      ? t('no-clusters-detected')
      : filteredClusters.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const { pageRecords: paginatedClusters, paginationBindings } = usePagination('kubernetes-clusters', filteredClusters)

const { HeadCells, BodyCells } = useClusterColumns({
  body: (cluster: XoKubernetesCluster) => {
    return {
      cluster: r =>
        r({
          label: cluster.name,
          to: getKubernetesClusterRoute(cluster.id),
          icon: icon('object:cluster'),
        }),
      version: r => r(''),
      status: r => r({ status: kubernetesClusterPhaseToStatus(cluster.phase), tooltip: cluster.phase }),
      controlPlaneNodes: r =>
        r(`${cluster.controlPlaneStatus.readyReplicas}/${cluster.controlPlaneStatus.desiredReplicas}`),
      workerNodes: r => r(`${cluster.workerStatus.readyReplicas}/${cluster.workerStatus.desiredReplicas}`),
      pods: r => r(''),
      tags: r => r(kubernetesTagsToDisplayStrings(cluster.tags), 'info'),
      selectItem: r => r(() => (selectedClusterId.value = cluster.id)),
    }
  },
})
</script>

<style scoped lang="postcss">
.container,
.clusters-table {
  display: flex;
  flex-direction: column;
}

.clusters-table {
  gap: 2.4rem;

  .container {
    gap: 0.8rem;
  }
}
</style>
