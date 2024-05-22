# `useTree` composable

The `useTree` composable handles a collection of nodes (called `Leaf` and `Branch`) in a tree structure.

`Leaf` and `Branch` can be _selected_, _activated_, and/or _filtered_.

Additionally, `Branch` can be _expanded_ and contains `Leaf` and/or `Branch` children.

Multiple nodes can be selected at the same time (if `allowMultiSelect` is `true`). But only one node can be activated at
a time.

## Usage

The `useTree` composable takes an array of definitions (called `LeafDefinition` and `BranchDefinition`) as first
argument, and an optional object of options as second argument.

```ts
useTree(definitions)
useTree(definitions, options)
```

|                            | Required | Type                                     | Default     |                                                       |
| -------------------------- | :------: | ---------------------------------------- | ----------- | ----------------------------------------------------- |
| `definitions`              |    ✓     | `(LeafDefinition \| BranchDefinition)[]` |             | The definitions of the nodes in the collection        |
| `options.allowMultiSelect` |          | `boolean`                                | `false`     | Whether more than one node can be selected at a time. |
| `options.expand`           |          | `boolean`                                | `true`      | Whether all branches are initially expanded.          |
| `options.selectedLabel`    |          | `function \| object`                     | `undefined` | See below                                             |

### `options.selectedLabel`

This option allows you to customize the label of the selected nodes.

| Type of `options.selectedLabel`                  | Description                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `undefined`                                      | The generated label will be a join of the selected nodes' labels.                                       |
| `(nodes: TreeNode[]) => string`                  | The selected nodes will be passed as first argument.                                                    |
| `{ max: number; fn: (count: number) => string }` | If more than `max` nodes are selected, the label will be the result of `fn(numberOfSelectedTreeNodes)`. |

## `useTree` return values

|                 | Type                                       |                                                                                    |
| --------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| `nodes`         | `(Leaf \| Branch)[]`                       | Array of **visible** `Leaf` and `Branch` instances (See TreeNode Visibility below) |
| `activeId`      | `Ref<string \| number \| undefined>`       | The active node id                                                                 |
| `activeNode`    | `ComputedRef<Leaf \| Branch \| undefined>` | The active node instance                                                           |
| `selectedIds`   | `Ref<(string \| number)[]>`                | Array of selected nodes id                                                         |
| `selectedNodes` | `ComputedRef<(Leaf \| Branch)[]>`          | Array of selected nodes instance                                                   |
| `selectedLabel` | `ComputedRef<string>`                      | The generator label for the selected nodes                                         |

## `LeafDefinition`

```ts
new LeafDefinition(data)
new LeafDefinition(data, options)
```

|                         |       Required       | Type                                                 | Default                                 |                                                                                        |
| ----------------------- | :------------------: | ---------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| `data`                  |          ✓           | `TData`                                              |                                         | data to be stored in the node                                                          |
| `options.discriminator` |                      | `string`                                             | `undefined`                             | discriminator for the node when you mix different data types (see Discriminator below) |
| `options.predicate`     |                      | `(node: TreeNode) => boolean \| undefined`           | `undefined`                             | filter function (see Filtering below)                                                  |
| `options.selectable`    |                      | `boolean`                                            | `true` for `Leaf`, `false` for `Branch` | whether the node can be selected                                                       |
| `options.getId`         |  if no `TData[id]`   | `keyof TData` \| `(data: TData) => string \| number` | `id`                                    | field or function to get a unique identifier for the node                              |
| `options.getLabel`      | if no `TData[label]` | `keyof TData` \| `(data: TData) => string`           | `label`                                 | field or function to get a label for the node                                          |

### Example

```ts
const definition = new LeafDefinition({ id: 1, label: 'John Doe', age: 30 })
```

## `BranchDefinition`

A `BranchDefinition` is very similar to a `LeafDefinition`, but it contains a collection of children definitions.

```ts
new BranchDefinition(data, children)
new BranchDefinition(data, options, children)
```

|                            |     | Type                   | Default |                                                                  |
| -------------------------- | --- | ---------------------- | ------- | ---------------------------------------------------------------- |
| (same as `LeafDefinition`) |     |                        |         |                                                                  |
| `children`                 | ✓   | `TreeNodeDefinition[]` |         | array of definitions for nodes that are contained in this branch |

### Example

```ts
const definition = new BranchDefinition({ id: 'smithes', name: 'The Smithes' }, [
  new LeafDefinition({ id: 'jd-1', name: 'John Smith', age: 30 }),
  new LeafDefinition({ id: 'jd-2', name: 'Jane Smith', age: 28 }),
])
```

## Discriminator

The `discriminator` is a string used to differentiate between different types of nodes. This is useful when you want to
mix different types of nodes at the same collection depth.

### Mixed data without discriminator

```ts
const definitions = [
  new LeafDefinition({ id: 'jd-1', label: 'John Doe', age: 30 }),
  new LeafDefinition({ id: 'rx-1', label: 'Rex', breed: 'Golden Retriever' }),
]

const { nodes } = useTree(definitions)

nodes.value.forEach(node => {
  // node.data.<cursor> neither 'age' nor 'breed' are available here because we can't know the type of the node
})
```

### Using the discriminator

```ts
const definitions = [
  new LeafDefinition({ id: 'jd-1', label: 'John Doe', age: 30 }, { discriminator: 'person' }),
  new LeafDefinition({ id: 'rx-1', label: 'Rex', breed: 'Golden Retriever' }, { discriminator: 'animal' }),
]

const { nodes } = useTree(definitions)

nodes.value.forEach(node => {
  if (node.discriminator === 'person') {
    // node.data.<cursor> `label` and `age` are available here
  } else {
    // node.data.<cursor> `label` and `breed` are available here
  }
})
```

### Mixing `BranchDefinition` and `LeafDefinition` (of same types each)

If you mix `BranchDefinition` and `LeafDefinition` of same types each, you don't need to use the discriminator because
the `isBranch` property will serve the same purpose.

```ts
const definitions = [
  new LeafDefinition({ id: 'jd-1', label: 'John Doe', age: 30 }),
  new BranchDefinition({ id: 'dogs', label: 'Dogs', legs: 4 }, [
    /* ... */
  ]),
]

const { nodes } = useTree(definitions)

nodes.value.forEach(node => {
  if (node.isBranch) {
    // node.data.<cursor> `label` and `legs` are available here
  } else {
    // node.data.<cursor> `label` and `age` are available here
  }
})
```

## Filtering

The optional `predicate` function is used to filter the node across the tree and can affect its visibility (see
TreeNode Visibility below).

It takes the `data` as first argument and will return:

- `true` if the node explicitly passes the filter
- `false` if the node explicitly doesn't pass the filter
- `undefined` if the filter doesn't apply to the node

For basic filtering on label you can use the `useTreeFilter` composable which returns `filter` (`Ref<string>`) and a
predefined `predicate` function (`(node: TreeNodeBase) => boolean | undefined`) which can be passed as an option.

## `defineTree` helper

The `defineTree` helper creates a collection of definitions in a more convenient way.

```ts
defineTree(entries)
defineTree(entries, options)
defineTree(entries, defineChildTree)
defineTree(entries, options, defineChildTree)
```

|                         |       Required       | Type                                                  | Default     |                                                                                 |
| ----------------------- | :------------------: | ----------------------------------------------------- | ----------- | ------------------------------------------------------------------------------- |
| `entries`               |          ✓           | `(TData extends object)[]`                            |             | array of entries for which to create a definition                               |
| `options.getId`         |  If no `TData[id]`   | `keyof TData` \| (data: TData) => `string`\| `number` | `id`        | field or function to get a unique identifier for the node                       |
| `options.getLabel`      | If no `TData[label]` | `keyof TData` \| (data: TData) => `string`            | `label`     | field or function to get a label for the node                                   |
| `options.discriminator` |                      | `string`                                              | `undefined` | discriminator for the node when you mix different data types                    |
| `options.predicate`     |                      | `(node: TreeNode) => boolean \| undefined`            | `undefined` | filter function that takes the data as first argument                           |
| `defineChildTree`       |                      | `(data: TData) => TreeNodeDefinition[]`               |             | function that returns an array of definitions that are contained in this branch |

Let's take this `families` example:

```ts
const families = [
  {
    id: 'does',
    label: 'The Does',
    members: [
      {
        id: 'jd-1',
        label: 'John Doe',
        age: 30,
        animals: [
          {
            id: 'jd-1-dog',
            label: 'Rex',
          },
        ],
      },
      {
        id: 'jd-2',
        label: 'Jane Doe',
        age: 28,
        animals: [],
      },
    ],
  },
  {
    id: 'smiths',
    label: 'The Smiths',
    members: [
      {
        id: 'js-1',
        label: 'John Smith',
        age: 35,
        animals: [
          {
            id: 'js-1-cat',
            label: 'Whiskers',
          },
          {
            id: 'js-1-dog',
            label: 'Fido',
          },
        ],
      },
      {
        id: 'js-2',
        label: 'Jane Smith',
        age: 33,
        animals: [
          {
            id: 'js-2-cat',
            label: 'Mittens',
          },
        ],
      },
    ],
  },
]
```

You can use the `defineTree` helper this way:

```ts
const definitions = defineTree(families, family => defineTree(family.members, member => defineTree(member.animals)))
```

This is the equivalent of the following code:

```ts
const definitions = families.map(
  family =>
    new BranchDefinition(
      family,
      family.members.map(
        member =>
          new BranchDefinition(
            member,
            member.animals.map(animal => new LeafDefinition(animal))
          )
      )
    )
)
```

### `getId` and `getLabel`

By default, ID will be retrieved from the `id` field and label from the `label` field.

You can override this behavior by passing a function or a field name.

```ts
const entries = [
  { uuid: 'jd-1', name: 'John Doe' },
  { uuid: 'jd-2', name: 'Jane Doe' },
]

const definitionsA = defineTree(entries, {
  getId: 'uuid',
  getLabel: 'name',
})

const definitionsB = defineTree(entries, {
  getId: entry => entry.uuid,
  getLabel: entry => entry.name,
})
```

## `Leaf` and `Branch` instances

`Leaf` and `Branch` instances have the following properties:

|                 |                             |                                                                     |
| --------------- | --------------------------- | ------------------------------------------------------------------- |
| `id`            | `string` \| `number`        | unique identifier across the whole collection of leafs and branches |
| `label`         | `string`                    | the label of the node                                               |
| `isBranch`      | `boolean`                   | `true`for `Branch` instances, `false` for `Leaf` instances          |
| `discriminator` | `string` \| `undefined`     | discriminator for the node when you mix different data types        |
| `data`          | `TData`                     | data stored in the node                                             |
| `depth`         | `number`                    | depth of the node in the collection                                 |
| `isSelected`    | `boolean`                   | whether the node is selected                                        |
| `isActive`      | `boolean`                   | whether the node is active                                          |
| `isVisible`     | `boolean`                   | whether the node is visible (see TreeNode Visibility below)         |
| `activate`      | `() => void`                | function to activate the node                                       |
| `toggleSelect`  | `(force?: boolean) => void` | function to toggle the selection of the node                        |
| `statuses`      | `{ [name]: boolean }`       | object of Node statuses (see below)                                 |

### `statuses`

The `statuses` properties is an object for Node statuses.

It can, for example, be used in the template `:class`.

_This object is just a helper. It doesn't come with any default style._

For a `Leaf` instance, it contains the following properties:

- `selected`: whether the leaf is selected
- `active`: whether the leaf is active
- `matches`: whether the leaf matches the filter

## `Branch` instances

Additionally, `Branch` instances have the following properties:

|                                |              |                                                 |
| ------------------------------ | ------------ | ----------------------------------------------- |
| `isExpanded`                   | `boolean`    | whether the branch is expanded                  |
| `areChildrenFullySelected`     | `boolean`    | whether all children are selected               |
| `areChildrenPartiallySelected` | `boolean`    | whether some children are selected              |
| `rawChildren`                  | `TreeNode[]` | array of all children instances                 |
| `children`                     | `TreeNode[]` | array of visible children instances (see below) |

### `statuses`

_This object is just a helper. It doesn't come with any default style._

For a `Branch` instance, it contains the following properties:

- `selected`: whether the branch is selected
- `selected-partial`: whether the branch is partially selected (i.e., some children are selected)
- `selected-full`: whether the branch is fully selected (i.e., all children are selected)
- `expanded`: whether the branch is expanded
- `active`: whether the branch is active
- `matches`: whether the branch matches the filter

## TreeNode Visibility

Here are the rules to determine whether a node is visible or not.

**Note**: Only the first matching rule determines a node's visibility. Subsequent rules are not evaluated.

1. If `predicate` returns `true` => _visible_
2. If any of its ancestors `predicate` returns `true` => _visible_
3. _(`Branch` only)_ If any of its descendants `predicate` returns `true` => _visible_
4. If `predicate` returns `false` => _**not** visible_
5. If it doesn't have a parent => _visible_
6. If the parent's `isExpanded` is `true` => _visible_
7. If the parent's `isExpanded` is `false` => _**not** visible_

## Example 1: Tree View

```html
<template>
  <ul>
    <li v-for="familyNode in nodes" :key="familyNode.id">
      <div class="label" @click="familyNode.toggleExpand()">
        {{ familyNode.isExpanded ? '↓' : '→' }} {{ familyNode.label }}
      </div>
      <ul v-if="familyNode.isExpanded" class="members">
        <li v-for="memberNode in familyNode.children" :key="memberNode.id">
          <div class="label" @click="memberNode.toggleExpand()">
            {{ memberNode.isExpanded ? '↓' : '→' }} {{ memberNode.label }} ({{ memberNode.data.age }})
          </div>
          <ul v-if="memberNode.isExpanded" class="animals">
            <li v-for="animalNode in memberNode.children" :key="animalNode.id">{{ animalNode.label }}</li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts" setup>
  const familyDefinitions = defineTree(families, ({ members }) =>
    defineTree(members, ({ animals }) => defineTree(animals))
  )

  const { nodes } = useTree(familyDefinitions)
</script>

<style lang="postcss" scoped>
  .persons,
  .animals {
    padding-left: 20px;
  }

  .animals li {
    padding-left: 10px;
  }

  .label {
    cursor: pointer;
  }
</style>
```

## Example 2: Multi-select

```html
<template>
  <ul>
    <li v-for="family in nodes" :key="family.id">
      <div
        class="label family"
        :class="family.statuses"
        @mouseenter="family.activate()"
        @click="family.toggleChildrenSelect()"
      >
        {{ family.label }}
      </div>
      <ul class="persons">
        <li v-for="person in family.children" :key="person.id">
          <div
            class="label person"
            :class="person.statuses"
            @mouseenter="person.activate()"
            @click="person.toggleSelect()"
          >
            {{ person.label }} ({{ person.data.age }})
          </div>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts" setup>
  const definitions = defineTree(families, ({ members }) => defineTree(members))

  const { nodes } = useTree(definitions, { allowMultiSelect: true })
</script>

<style lang="postcss" scoped>
  .persons {
    padding-left: 20px;
  }

  .family {
    background-color: #eaeaea;

    &.selected-full {
      background-color: #add8e6;
    }

    &.active {
      filter: brightness(1.1);
    }
  }

  .person {
    background-color: #f5f5f5;

    &.selected {
      background-color: #b5e2f1;
    }

    &.active {
      filter: brightness(1.07);
    }
  }
</style>
```

### Example 3: Filtering

```html
<template>
  <div>
    <input v-model="filter" placeholder="Filter" />
  </div>
  <ul>
    <li v-for="family in nodes" :key="family.id">
      <div :class="family.statuses">{{ family.label }}</div>
      <ul class="sub">
        <li v-for="person in family.children" :key="person.id">
          <div :class="person.statuses">{{ person.label }} ({{ person.data.age }})</div>
          <ul class="sub">
            <li v-for="animal in person.children" :key="animal.id">
              <div :class="animal.statuses">{{ animal.label }}</div>
            </li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts" setup>
  const filter = ref<string>()

  const predicate = ({ label }: { label: string }) => {
    const filterValue = filter.value?.trim().toLocaleLowerCase() ?? false

    return !filterValue ? undefined : label.toLocaleLowerCase().includes(filterValue)
  }

  const definitions = defineTree(families, { predicate }, ({ members }) =>
    defineTree(members, { predicate }, ({ animals }) => defineTree(animals, { predicate }))
  )

  const { nodes } = useTree(definitions, { expand: false })
</script>

<style lang="postcss" scoped>
  .sub {
    padding-left: 20px;
  }

  .matches {
    font-weight: bold;
  }
</style>
```
