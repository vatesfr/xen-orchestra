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
import NodeActions from '@/modules/kubernetes/components/actions/node/NodeActions.vue'
import { useXoKubernetesNodeUtils } from '@/modules/kubernetes/composables/xo-kubernetes-node-utils.composable.ts'
import { useKubernetesNodeColumns } from '@/modules/kubernetes/tables/kubernetes-node-columns.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { isControlPlaneNode, nodeReadyStatus } from '@/modules/kubernetes/utils/kubernetes-node.util.ts'
import { getKubernetesNodeRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
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

const selectedNodeId = useRouteQuery('id')

const { items: filteredNodes, filter } = useQueryBuilderFilter('kubernetes-nodes', () => rawNodes)

const { roleLabels } = useXoKubernetesNodeUtils()

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
      role: r => r(roleLabels.value[node.role]),
      version: r => r(node.version),
      ipAddresses: r => r(node.ips ?? []),
      actions: r =>
        r({
          onClick: () => (selectedNodeId.value = node.id),
          component: NodeActions,
          props: { node },
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
