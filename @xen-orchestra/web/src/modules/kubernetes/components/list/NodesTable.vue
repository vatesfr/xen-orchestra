<template>
  <div class="nodes-table">
    <UiTitle>
      {{ t('nodes') }}
    </UiTitle>
    <VtsQueryBuilder v-model="filter" :schema />
    <div class="container">
      <VtsTable :state :pagination-bindings sticky="right">
        <thead>
          <HeadCells />
        </thead>
        <tbody>
          <VtsRow v-for="node of paginatedNodes" :key="node.id" :selected="selectedNodeId === node.id">
            <BodyCells :item="node" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoKubernetesClusterCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-cluster-collection.ts'
import { useKubernetesNodeColumns } from '@/modules/kubernetes/tables/kubernetes-node-columns.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { isControlPlaneNode, nodeReadyStatus } from '@/modules/kubernetes/utils/kubernetes-node.util.ts'
import { getKubernetesClusterRoute, getKubernetesNodeRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
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
import { useStringSchema } from '@core/utils/query-builder/use-string-schema.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  nodes: rawNodes,
  busy,
  error,
} = defineProps<{
  nodes: XoKubernetesNode[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const { getClusterById } = useXoKubernetesClusterCollection()

const selectedNodeId = useRouteQuery('id')

const { items: filteredNodes, filter } = useQueryBuilderFilter('kubernetes-nodes', () => rawNodes)

const roleLabels = computed<Record<XoKubernetesNode['role'], string>>(() => ({
  'control-plane': t('control-plane'),
  worker: t('worker'),
}))

const schema = useQueryBuilderSchema<XoKubernetesNode>({
  '': useStringSchema(t('any-property')),
  name: useStringSchema(t('name')),
  role: useStringSchema(t('role'), {
    'control-plane': t('control-plane'),
    worker: t('worker'),
  }),
  status: useStringSchema(t('status'), {
    Ready: t('ready'),
    NotReady: t('not-ready'),
  }),
})

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () =>
    rawNodes.length === 0 ? t('no-nodes-detected') : filteredNodes.value.length === 0 ? { type: 'no-result' } : false,
})

const { pageRecords: paginatedNodes, paginationBindings } = usePagination('kubernetes-nodes', filteredNodes)

const { HeadCells, BodyCells } = useKubernetesNodeColumns({
  body: (node: XoKubernetesNode) => {
    return {
      name: r =>
        r({
          label: node.name,
          to: getKubernetesNodeRoute(node.id),
          icon: icon('object:node'),
          rightIcon: isControlPlaneNode(node)
            ? { icon: icon('status:primary-circle'), tooltip: t('control-plane') }
            : undefined,
        }),
      status: r => r({ status: nodeReadyStatus(node) }),
      version: r => r(node.version),
      role: r => r(roleLabels.value[node.role]),
      cluster: r =>
        r({
          label: getClusterById(node.$cluster)?.name ?? node.$cluster,
          to: getKubernetesClusterRoute(node.$cluster),
          icon: icon('object:cluster'),
        }),
      actions: r =>
        r({
          onClick: () => (selectedNodeId.value = node.id),
        }),
    }
  },
})
</script>

<style scoped lang="postcss">
.container,
.nodes-table {
  display: flex;
  flex-direction: column;
}

.nodes-table {
  gap: 2.4rem;

  .container {
    gap: 0.8rem;
  }
}
</style>
