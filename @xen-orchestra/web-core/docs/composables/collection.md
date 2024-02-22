# `useCollection` composable

The `useCollection` composable handles a collection of items (called `Leaf` and `Group`) in a tree structure.

`Leaf` and `Group` can be _selected_, _activated_, and/or _filtered_.

Additionally, `Group` can be _expanded_ and contains `Leaf` and/or `Group` children.

Multiple items can be selected at the same time (if `allowMultiSelect` is `true`). But only one item can be activated at
a time.

## Usage

The `useCollection` composable takes an array of definitions (called `LeafDefinition` and `GroupDefinition`) as first
argument, and an optional object of options as second argument.

```ts
useCollection(definitions)
useCollection(definitions, options)
```

|                            | Required | Type                                    | Default |                                                       |
| -------------------------- | :------: | --------------------------------------- | ------- | ----------------------------------------------------- |
| `definitions`              |    ✓     | `(LeafDefinition \| GroupDefinition)[]` |         | The definitions of the items in the collection        |
| `options.allowMultiSelect` |          | `boolean`                               | `false` | Whether more than one item can be selected at a time. |
| `options.expanded`         |          | `boolean`                               | `true`  | Whether all groups are initially expanded.            |

## `useCollection` return values

|                 | Type                                      |                                                                           |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `items`         | `(Leaf \| Group)[]`                       | Array of visible `Leaf` and `Group` instances (See Item Visibility below) |
| `activeId`      | `ComputedRef<string \| undefined>`        | The id of the active item                                                 |
| `activeItem`    | `ComputedRef<Leaf \| Group \| undefined>` | The active item instance                                                  |
| `selectedIds`   | `ComputedRef<string[]>`                   | Array of selected item ids                                                |
| `selectedItems` | `ComputedRef<(Leaf \| Group)[]>`          | Array of selected item instances                                          |
| `expandedIds`   | `ComputedRef<string[]>`                   | Array of expanded group ids                                               |
| `expandedItems` | `ComputedRef<Group[]>`                    | Array of expanded group instances                                         |

## `LeafDefinition`

```ts
new LeafDefinition(id, data)
new LeafDefinition(id, data, options)
```

|                         | Required | Type                                | Default     |                                                                                        |
| ----------------------- | :------: | ----------------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| `id`                    |    ✓     | `string`                            |             | unique identifier across the whole collection of leafs and groups                      |
| `data`                  |    ✓     | `T`                                 |             | data to be stored in the item                                                          |
| `options.discriminator` |          | `string`                            | `undefined` | discriminator for the item when you mix different data types (see Discriminator below) |
| `options.passesFilter`  |          | `(data: T) => boolean \| undefined` | `undefined` | filter function (see Filtering below)                                                  |

### Example

```ts
const definition = new LeafDefinition('jd-1', { name: 'John Doe', age: 30 })
```

## `GroupDefinition`

A `GroupDefinition` is very similar to a `LeafDefinition`, but it contains a collection of children definitions.

```ts
new GroupDefinition(id, data, children)
new GroupDefinition(id, data, options, children)
```

|                         |     | Type                                    | Default     |                                                                                        |
| ----------------------- | --- | --------------------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| `id`                    | ✓   | `string`                                |             | unique identifier across the whole collection of leafs and groups                      |
| `data`                  | ✓   | `any`                                   |             | data to be stored in the item                                                          |
| `options.discriminator` |     | `string`                                | `undefined` | discriminator for the item when you mix different data types (see Discriminator below) |
| `options.passesFilter`  |     | `(data) => boolean \| undefined`        | `undefined` | filter function (see Filtering below)                                                  |
| `children`              | ✓   | `(LeafDefinition \| GroupDefinition)[]` |             | array of items that are contained in this group                                        |

### Example

```ts
const definition = new GroupDefinition('smithes', { name: 'The Smithes' }, [
  new ItemDefinition('jd-1', { name: 'John Smith', age: 30 }),
  new ItemDefinition('jd-2', { name: 'Jane Smith', age: 28 }),
])
```

## Discriminator

The `discriminator` is a string used to differentiate between different types of items. This is useful when you want to
mix different types of items at the same collection depth.

### Mixed data without discriminator

```ts
const definitions = [
  new LeafDefinition('jd-1', { name: 'John Doe', age: 30 }),
  new LeafDefinition('rx-1', { name: 'Rex', breed: 'Golden Retriever' }),
]

const { items } = useCollection(definitions)

items.value.forEach(item => {
  // item.data.<cursor> neither 'age' nor 'breed' are available here because we can't know the type of the item
})
```

### Using the discriminator

```ts
const definitions = [
  new LeafDefinition('jd-1', { name: 'John Doe', age: 30 }, { discriminator: 'person' }),
  new LeafDefinition('rx-1', { name: 'Rex', breed: 'Golden Retriever' }, { discriminator: 'animal' }),
]

const { items } = useCollection(definitions)

items.value.forEach(item => {
  if (item.discriminator === 'person') {
    // item.data.<cursor> `name` and `age` are available here
  } else {
    // item.data.<cursor> `name` and `breed` are available here
  }
})
```

### Mixing `GroupDefinition` and `LeafDefinition` (of same types each)

If you mix `LeafDefinition` and `GroupDefinition` (of same types each), you don't need to use the discriminator because
the `isGroup` property will serve the same purpose.

```ts
const definitions = [
  new LeafDefinition('jd-1', { name: 'John Doe', age: 30 }),
  new GroupDefinition('dogs', { name: 'Dogs', legs: 4 }, [
    /* ... */
  ]),
]

const { items } = useCollection(definitions)

items.value.forEach(item => {
  if (item.isGroup) {
    // item.data.<cursor> `name` and `legs` are available here
  } else {
    // item.data.<cursor> `name` and `age` are available here
  }
})
```

## Filtering

The optional `passesFilter` function is used to filter the item across the collection and can affect its visibility (see
Item Visibility below).

It takes the `data` as first argument and will return:

- `true` if the item explicitly passes the filter
- `false` if the item explicitly doesn't pass the filter
- `undefined` if the filter is ignored

## `defineCollection` helper

The `defineCollection` helper creates a collection of definitions in a more convenient way.

```ts
defineCollection(entries)
defineCollection(entries, options)
defineCollection(entries, getChildren)
defineCollection(entries, options, getChildren)
```

|                         | Required | Type                             | Default     |                                                                                |
| ----------------------- | :------: | -------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| `entries`               |    ✓     | `T[]`                            |             | array of items to be stored in the collection                                  |
| `options.idField`       |          | `keyof T`                        | `id`        | field to be used as the unique identifier for the items.                       |
| `options.discriminator` |          | `string`                         | `undefined` | discriminator for the item when you mix different data types                   |
| `options.passesFilter`  |          | `(data) => boolean \| undefined` | `undefined` | filter function that takes the data as first argument                          |
| `getChildren`           |    ✓     | `(data: T) => Definition[]`      |             | function that returns an array of definitions that are contained in this group |

Let's take this `families` example:

```ts
const familiesData = [
  {
    id: 'does',
    name: 'The Does',
    members: [
      {
        id: 'jd-1',
        name: 'John Doe',
        age: 30,
        animals: [
          {
            id: 'jd-1-dog',
            name: 'Rex',
          },
        ],
      },
      {
        id: 'jd-2',
        name: 'Jane Doe',
        age: 28,
        animals: [],
      },
    ],
  },
  {
    id: 'smiths',
    name: 'The Smiths',
    members: [
      {
        id: 'js-1',
        name: 'John Smith',
        age: 35,
        animals: [
          {
            id: 'js-1-cat',
            name: 'Whiskers',
          },
          {
            id: 'js-1-dog',
            name: 'Fido',
          },
        ],
      },
      {
        id: 'js-2',
        name: 'Jane Smith',
        age: 33,
        animals: [
          {
            id: 'js-2-cat',
            name: 'Mittens',
          },
        ],
      },
    ],
  },
]
```

You can use the `defineCollection` helper:

```ts
const definitions = defineCollection(familiesData, family =>
  defineCollection(family.members, person => defineCollection(person.animals))
)
```

This is the equivalent of the following code:

```ts
const definitions = familiesData.map(
  family =>
    new GroupDefinition(
      family.id,
      family,
      family.members.map(
        person =>
          new GroupDefinition(
            person.id,
            person,
            person.animals.map(animal => new ItemDefinition(animal.id, animal))
          )
      )
    )
)
```

## `Leaf` and `Group` instances

`Leaf` and `Group` instances have the following properties:

|                 |                             |                                                                   |
| --------------- | --------------------------- | ----------------------------------------------------------------- |
| `id`            | `string`                    | unique identifier across the whole collection of leafs and groups |
| `isGroup`       | `boolean`                   | `true`for `Group` instances, `false` for `Leaf` instances         |
| `discriminator` | `string` \| `undefined`     | discriminator for the item when you mix different data types      |
| `data`          | `T`                         | data stored in the item                                           |
| `depth`         | `number`                    | depth of the item in the collection                               |
| `isSelected`    | `boolean`                   | whether the item is selected                                      |
| `isActive`      | `boolean`                   | whether the item is active                                        |
| `isVisible`     | `boolean`                   | whether the item is visible (see below)                           |
| `activate`      | `() => void`                | function to activate the item                                     |
| `toggleSelect`  | `(force?: boolean) => void` | function to toggle the selection of the item                      |

## `Group` instances

Additionally, `Group` instances have the following properties:

|                                |           |                                                 |
| ------------------------------ | --------- | ----------------------------------------------- |
| `isExpanded`                   | `boolean` | whether the item is expanded                    |
| `areChildrenFullySelected`     | `boolean` | whether all children are selected               |
| `areChildrenPartiallySelected` | `boolean` | whether some children are selected              |
| `rawChildren`                  | `Item[]`  | array of all children instances                 |
| `children`                     | `Item[]`  | array of visible children instances (see below) |

## Item Visibility

Here are the rules to determine whether an item is visible or not.

If a rule applies, other rules are not evaluated.

1. If `passesFilter` returns `true` => _visible_
2. If any of its ancestors `passesFilter` returns `true` => _visible_
3. _(`Group` only)_ If any of its descendants `passesFilter` returns `true` => _visible_
4. If `passesFilter` returns `false` => _**not** visible_
5. If it doesn't have a parent => _visible_
6. If the parent's `isExpanded` is `true` => _visible_
7. If the parent's `isExpanded` is `false` => _**not** visible_

## Example 1: Tree View

```ts
const definitions = defineCollection(familiesData, family =>
  defineCollection(family.members, person => defineCollection(person.animals))
)

const { items: families } = useCollection(definitions)
```

```html

<template>
  <ul>
    <li v-for="family in families" :key="family.id">
      <button @click="family.toggleExpand()">
        {{ family.isExpanded ? '↓' : '→' }}
      </button>
      {{ family.data.name }}
      <ul v-if="family.isExpanded">
        <li v-for="person in family.children" :key="person.id">
          <button @click="person.toggleExpand()">
            {{ person.isExpanded ? '↓' : '→' }}
          </button>
          {{ person.data.name }} ({{ person.data.age }})
          <ul v-if="person.isExpanded">
            <li v-for="animal in person.children" :key="animal.id">
              {{ animal.data.name }}
            </li>
        </li>
      </ul>
    </li>
  </ul>
</template>
```
