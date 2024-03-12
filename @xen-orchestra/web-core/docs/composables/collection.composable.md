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

|                            | Required | Type                                    | Default     |                                                       |
| -------------------------- | :------: | --------------------------------------- | ----------- | ----------------------------------------------------- |
| `definitions`              |    ✓     | `(LeafDefinition \| GroupDefinition)[]` |             | The definitions of the items in the collection        |
| `options.allowMultiSelect` |          | `boolean`                               | `false`     | Whether more than one item can be selected at a time. |
| `options.expand`           |          | `boolean`                               | `true`      | Whether all groups are initially expanded.            |
| `options.selectedLabel`    |          | `function \| object`                    | `undefined` | See below                                             |

### `options.selectedLabel`

This option allows you to customize the label of the selected items.

| Type of `options.selectedLabel`                  | Description                                                                                         |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `undefined`                                      | The generated label will be a join of the selected items' labels.                                   |
| `(items: Item[]) => string`                      | The selected items will be passed as first argument.                                                |
| `{ max: number; fn: (count: number) => string }` | If more than `max` items are selected, the label will be the result of `fn(numberOfSelectedItems)`. |

## `useCollection` return values

|                 | Type                                      |                                                                           |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `items`         | `(Leaf \| Group)[]`                       | Array of visible `Leaf` and `Group` instances (See Item Visibility below) |
| `activeItem`    | `ComputedRef<Leaf \| Group \| undefined>` | The active item instance                                                  |
| `selectedItems` | `ComputedRef<(Leaf \| Group)[]>`          | Array of selected item instances                                          |
| `expandedItems` | `ComputedRef<Group[]>`                    | Array of expanded group instances                                         |
| `selectedLabel` | `ComputedRef<string>`                     | The label of the selected items                                           |

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
const definition = new LeafDefinition({ id: 1, label: 'John Doe', age: 30 })
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
const definition = new GroupDefinition({ id: 'smithes', name: 'The Smithes' }, [
  new ItemDefinition({ id: 'jd-1', name: 'John Smith', age: 30 }),
  new ItemDefinition({ id: 'jd-2', name: 'Jane Smith', age: 28 }),
])
```

## Discriminator

The `discriminator` is a string used to differentiate between different types of items. This is useful when you want to
mix different types of items at the same collection depth.

### Mixed data without discriminator

```ts
const definitions = [
  new LeafDefinition({ id: 'jd-1', label: 'John Doe', age: 30 }),
  new LeafDefinition({ id: 'rx-1', label: 'Rex', breed: 'Golden Retriever' }),
]

const { items } = useCollection(definitions)

items.value.forEach(item => {
  // item.data.<cursor> neither 'age' nor 'breed' are available here because we can't know the type of the item
})
```

### Using the discriminator

```ts
const definitions = [
  new LeafDefinition({ id: 'jd-1', label: 'John Doe', age: 30 }, { discriminator: 'person' }),
  new LeafDefinition({ id: 'rx-1', label: 'Rex', breed: 'Golden Retriever' }, { discriminator: 'animal' }),
]

const { items } = useCollection(definitions)

items.value.forEach(item => {
  if (item.discriminator === 'person') {
    // item.data.<cursor> `label` and `age` are available here
  } else {
    // item.data.<cursor> `label` and `breed` are available here
  }
})
```

### Mixing `GroupDefinition` and `LeafDefinition` (of same types each)

If you mix `LeafDefinition` and `GroupDefinition` of same types each, you don't need to use the discriminator because
the `isGroup` property will serve the same purpose.

```ts
const definitions = [
  new LeafDefinition({ id: 'jd-1', label: 'John Doe', age: 30 }),
  new GroupDefinition({ id: 'dogs', label: 'Dogs', legs: 4 }, [
    /* ... */
  ]),
]

const { items } = useCollection(definitions)

items.value.forEach(item => {
  if (item.isGroup) {
    // item.data.<cursor> `label` and `legs` are available here
  } else {
    // item.data.<cursor> `label` and `age` are available here
  }
})
```

## Filtering

The optional `passesFilter` function is used to filter the item across the collection and can affect its visibility (see
Item Visibility below).

It takes the `data` as first argument and will return:

- `true` if the item explicitly passes the filter
- `false` if the item explicitly doesn't pass the filter
- `undefined` if the filter doesn't apply to the item

## `defineCollection` helper

The `defineCollection` helper creates a collection of definitions in a more convenient way.

```ts
defineCollection(entries)
defineCollection(entries, options)
defineCollection(entries, getChildren)
defineCollection(entries, options, getChildren)
```

|                         | Required | Type                                          | Default     |                                                                                |
| ----------------------- | :------: | --------------------------------------------- | ----------- | ------------------------------------------------------------------------------ |
| `entries`               |    ✓     | `T[]`                                         |             | array of items to be stored in the collection                                  |
| `options.getId`         |          | `keyof T` \| (data: T) => `string`\| `number` | `id`        | field or function to get a unique identifier for the item                      |
| `options.getLabel`      |          | `keyof T` \| (data: T) => `string`            | `label`     | field or function to get a label for the item                                  |
| `options.discriminator` |          | `string`                                      | `undefined` | discriminator for the item when you mix different data types                   |
| `options.passesFilter`  |          | `(data) => boolean \| undefined`              | `undefined` | filter function that takes the data as first argument                          |
| `getChildren`           |          | `(data: T) => Definition[]`                   |             | function that returns an array of definitions that are contained in this group |

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

You can use the `defineCollection` helper this way:

```ts
const definitions = defineCollection(families, family =>
  defineCollection(family.members, person => defineCollection(person.animals))
)
```

This is the equivalent of the following code:

```ts
const definitions = families.map(
  family =>
    new GroupDefinition(
      family,
      family.members.map(
        person =>
          new GroupDefinition(
            person,
            person.animals.map(animal => new ItemDefinition(animal))
          )
      )
    )
)
```

### `getId` and `getLabel`

By default, ID will be retrieved from the `id` field and label from the `label` field.

You can override this behavior by passing a function or a field name.

```ts
const items = [
  { uuid: 'jd-1', name: 'John Doe' },
  { uuid: 'jd-2', name: 'Jane Doe' },
]

const definitionsA = defineCollection(items, {
  getId: 'uuid',
  getLabel: 'name',
})

const definitionsB = defineCollection(items, {
  getId: item => item.uuid,
  getLabel: item => item.name,
})
```

## `Leaf` and `Group` instances

`Leaf` and `Group` instances have the following properties:

|                 |                             |                                                                   |
| --------------- | --------------------------- | ----------------------------------------------------------------- |
| `id`            | `string`                    | unique identifier across the whole collection of leafs and groups |
| `label`         | `string`                    | the label of the item                                             |
| `isGroup`       | `boolean`                   | `true`for `Group` instances, `false` for `Leaf` instances         |
| `discriminator` | `string` \| `undefined`     | discriminator for the item when you mix different data types      |
| `data`          | `T`                         | data stored in the item                                           |
| `depth`         | `number`                    | depth of the item in the collection                               |
| `isSelected`    | `boolean`                   | whether the item is selected                                      |
| `isActive`      | `boolean`                   | whether the item is active                                        |
| `isVisible`     | `boolean`                   | whether the item is visible (see Item Visibility below)           |
| `activate`      | `() => void`                | function to activate the item                                     |
| `toggleSelect`  | `(force?: boolean) => void` | function to toggle the selection of the item                      |
| `labelClasses`  | `{ [name]: boolean }`       | object of classes to be used in the template (see below)          |

### `labelClasses`

The `labelClasses` properties are classes to be used in the template `:class`.

_These classes are just helpers. They don't come with any default style._

For a `Leaf` instance, it contains the following properties:

- `selected`: whether the leaf is selected
- `active`: whether the leaf is active
- `matches`: whether the leaf matches the filter

## `Group` instances

Additionally, `Group` instances have the following properties:

|                                |           |                                                 |
| ------------------------------ | --------- | ----------------------------------------------- |
| `isExpanded`                   | `boolean` | whether the item is expanded                    |
| `areChildrenFullySelected`     | `boolean` | whether all children are selected               |
| `areChildrenPartiallySelected` | `boolean` | whether some children are selected              |
| `rawChildren`                  | `Item[]`  | array of all children instances                 |
| `children`                     | `Item[]`  | array of visible children instances (see below) |

### `labelClasses`

_These classes are just helpers. They don't come with any default style._

For a `Group` instance, it contains the following properties:

- `selected`: whether the group is selected
- `selected-partial`: whether the group is partially selected (i.e., some children are selected)
- `selected-full`: whether the group is fully selected (i.e., all children are selected)
- `expanded`: whether the group is expanded
- `active`: whether the group is active
- `matches`: whether the group matches the filter

## Item Visibility

Here are the rules to determine whether an item is visible or not.

**Note**: Only the first matching rule determines an item's visibility. Subsequent rules are not evaluated.

1. If `passesFilter` returns `true` => _visible_
2. If any of its ancestors `passesFilter` returns `true` => _visible_
3. _(`Group` only)_ If any of its descendants `passesFilter` returns `true` => _visible_
4. If `passesFilter` returns `false` => _**not** visible_
5. If it doesn't have a parent => _visible_
6. If the parent's `isExpanded` is `true` => _visible_
7. If the parent's `isExpanded` is `false` => _**not** visible_

## Example 1: Tree View

```html
<template>
  <ul>
    <li v-for="family in items" :key="family.id">
      <div class="label" @click="family.toggleExpand()">{{ family.isExpanded ? '↓' : '→' }} {{ family.label }}</div>
      <ul v-if="family.isExpanded" class="persons">
        <li v-for="person in family.children" :key="person.id">
          <div class="label" @click="person.toggleExpand()">
            {{ person.isExpanded ? '↓' : '→' }} {{ person.label }} ({{ person.data.age }})
          </div>
          <ul v-if="person.isExpanded" class="animals">
            <li v-for="animal in person.children" :key="animal.id">{{ animal.label }}</li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
</template>

<script lang="ts" setup>
  const definitions = defineCollection(families, ({ members }) =>
    defineCollection(members, ({ animals }) => defineCollection(animals))
  )

  const { items } = useCollection(definitions)
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
    <li v-for="family in items" :key="family.id">
      <div
        class="label family"
        :class="family.labelClasses"
        @mouseenter="family.activate()"
        @click="family.toggleChildrenSelect()"
      >
        {{ family.label }}
      </div>
      <ul class="persons">
        <li v-for="person in family.children" :key="person.id">
          <div
            class="label person"
            :class="person.labelClasses"
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
  const definitions = defineCollection(families, ({ members }) => defineCollection(members))

  const { items } = useCollection(definitions, { allowMultiSelect: true })
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
    <li v-for="family in items" :key="family.id">
      <div :class="family.labelClasses">{{ family.label }}</div>
      <ul class="sub">
        <li v-for="person in family.children" :key="person.id">
          <div :class="person.labelClasses">{{ person.label }} ({{ person.data.age }})</div>
          <ul class="sub">
            <li v-for="animal in person.children" :key="animal.id">
              <div :class="animal.labelClasses">{{ animal.label }}</div>
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

    return !filterValue ? undefined : name.toLocaleLowerCase().includes(filterValue)
  }

  const definitions = defineCollection(families, { predicate }, ({ members }) =>
    defineCollection(members, { predicate }, ({ animals }) => defineCollection(animals, { predicate }))
  )

  const { items } = useCollection(definitions, { expand: false })
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
