import { convertFilterToGroup } from '@core/packages/query-builder/filter/convert-filter-to-group.ts'
import { createEmptyFilter } from '@core/packages/query-builder/filter/create-empty-filter.ts'
import { duplicateNode } from '@core/packages/query-builder/node/duplicate-node.ts'
import { getRawFilter } from '@core/packages/query-builder/node/get-raw-filter.ts'
import type {
  GroupOperator,
  QueryBuilderGroup,
  QueryBuilderNode,
  QueryBuilderSchema,
} from '@core/packages/query-builder/types.ts'
import { ref, computed, reactive, type Ref } from 'vue'

let nextId = 1

export function createQueryBuilderGroup(config: {
  operator: GroupOperator
  children: QueryBuilderNode[]
  schema: QueryBuilderSchema
}): QueryBuilderGroup {
  const id = `group-${nextId++}`

  const operator = ref(config.operator)

  const children = ref(config.children || []) as Ref<QueryBuilderNode[]>

  const isGroup = true

  function addChildFilter(): void {
    const filter = createEmptyFilter(config.schema)

    children.value.push(filter)
  }

  function addChildGroup(): void {
    const group = createQueryBuilderGroup({
      operator: operator.value === 'and' ? 'or' : 'and',
      children: [createEmptyFilter(config.schema)],
      schema: config.schema,
    })

    children.value.push(group)
  }

  function convertChildToGroup(childIndex: number): void {
    const node = children.value[childIndex]

    if (node.isGroup) {
      return
    }

    const group = convertFilterToGroup(node, operator.value === 'and' ? 'or' : 'and', config.schema)

    children.value.splice(childIndex, 1, group)
  }

  function wrapInGroup() {
    const currentGroup = createQueryBuilderGroup({
      operator: operator.value,
      children: children.value,
      schema: config.schema,
    })

    const newGroup = createQueryBuilderGroup({
      operator: operator.value,
      children: [createEmptyFilter(config.schema)],
      schema: config.schema,
    })

    operator.value = operator.value === 'and' ? 'or' : 'and'

    children.value = [currentGroup, newGroup]
  }

  function removeChild(childIndex: number, keepChildren = false) {
    if (!keepChildren) {
      children.value.splice(childIndex, 1)
      return
    }

    const child = children.value[childIndex]

    if (child.isGroup) {
      children.value.splice(childIndex, 1, ...child.children)
    } else {
      children.value.splice(childIndex, 1)
    }
  }

  function duplicateChild(childIndex: number) {
    const node = children.value[childIndex]

    if (!node) {
      return
    }

    const newNode = duplicateNode(node, config.schema)

    children.value.splice(childIndex + 1, 0, newNode)
  }

  const rawFilter = computed(() => getRawFilter(children.value, operator.value))

  return reactive({
    id,
    operator,
    children,
    isGroup,
    rawFilter,
    addChildFilter,
    addChildGroup,
    wrapInGroup,
    convertChildToGroup,
    duplicateChild,
    removeChild,
    schema: config.schema,
  })
}
