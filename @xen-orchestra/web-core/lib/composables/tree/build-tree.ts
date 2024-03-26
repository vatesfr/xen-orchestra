import { Group } from '@core/composables/tree/branch'
import { GroupDefinition } from '@core/composables/tree/branch-definition'
import { Leaf } from '@core/composables/tree/leaf'
import type { CollectionContext, Definition, DefinitionToItem, Item } from '@core/composables/tree/types'

export function buildCollection<TDefinition extends Definition>(
  definitions: TDefinition[],
  context: CollectionContext
): DefinitionToItem<TDefinition>[] {
  function create(definitions: Definition[], parent: Group | undefined, depth: number): Item[] {
    return definitions.map(definition =>
      definition instanceof GroupDefinition
        ? new Group(definition.data, parent, context, depth, definition.options, thisGroup =>
            create(definition.children, thisGroup, depth + 1)
          )
        : new Leaf(definition.data, parent, context, depth, definition.options)
    )
  }

  return create(definitions, undefined, 0) as DefinitionToItem<TDefinition>[]
}
