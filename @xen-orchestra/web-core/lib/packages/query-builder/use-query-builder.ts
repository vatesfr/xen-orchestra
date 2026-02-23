import { buildRootGroup } from '@core/packages/query-builder/group/build-root-group'
import { createQueryBuilderGroup } from '@core/packages/query-builder/group/create-query-builder-group'
import { handleNode } from '@core/packages/query-builder/node/handle-node.ts'
import type { QueryBuilderNode, QueryBuilderSchema, UseQueryBuilderReturn } from '@core/packages/query-builder/types.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { parse } from 'complex-matcher'

import { computed, ref, watch, type MaybeRefOrGetter, type Ref } from 'vue'

export function useQueryBuilder(
  filter: Ref<string>,
  schemaRaw: MaybeRefOrGetter<QueryBuilderSchema>
): UseQueryBuilderReturn {
  const rootNode = ref<QueryBuilderNode>()
  const schema = toComputed(schemaRaw)

  function generateRootNode() {
    try {
      const parsed = parse(filter.value)
      rootNode.value = handleNode({ node: parsed, negate: false, schema: schema.value })
    } catch {
      return undefined
    }
  }

  watch(filter, () => generateRootNode(), { immediate: true })

  const isUsable = computed(() => rootNode.value !== undefined)

  const rootGroup = computed(() => {
    if (rootNode.value === undefined) {
      return createQueryBuilderGroup({
        operator: 'and',
        children: [],
        schema: schema.value,
      })
    }

    return buildRootGroup(rootNode.value, schema.value)
  })

  function updateFilter() {
    filter.value = rootGroup.value.rawFilter
  }

  return {
    rootGroup,
    updateFilter,
    isUsable,
    resetFilter: generateRootNode,
  }
}
