# `useCollection` composable

The
`useCollection` composable helps you manage a collection of items with flags (boolean states) and computed properties. It provides a type-safe way to filter, flag, and manipulate items in a collection.

## Usage

```typescript
const { items, useSubset, useFlag, setFlag } = useCollection(sources, {
  identifier: source => source.id,
  flags: ['selected', 'active', { highlighted: { multiple: false } }],
  properties: source => ({
    isAvailable: computed(() => source.status === 'available'),
    fullName: computed(() => `${source.firstName} ${source.lastName}`),
  }),
})
```

## Core Concepts

- **Collection Item
  **: An object with a unique identifier, a reference to its source object, flags, computed properties, and methods to manipulate flags
- **Flags**: Boolean states attached to items (like 'selected', 'active', 'highlighted')
- **Properties**: Computed values derived from the source object

## `useCollection` parameters

| Name      | Type                              | Required | Description                                          |
| --------- | --------------------------------- | :------: | ---------------------------------------------------- |
| `sources` | `MaybeRefOrGetter<TSource[]>`     |    ✓     | Array of source objects for the collection           |
| `options` | `CollectionOptions<TSource, TId>` |    ✓     | Configuration options for the collection (see below) |

### `options` object

| Name           | Type                                               | Required | Description                                              |
| -------------- | -------------------------------------------------- | :------: | -------------------------------------------------------- |
| `identifier`   | `(source: TSource) => TId`                         |    ✓     | Function to extract a unique identifier from each source |
| `flags`        | `MaybeArray<string \| Record<string, FlagConfig>>` |          | Flags that can be applied to items in the collection     |
| `properties`   | `(source: TSource) => Record<string, ComputedRef>` |          | Function that returns computed properties for each item  |
| `collectionId` | `string`                                           |          | (usually handled automatically)                          |

### `FlagConfig` object

| Name       | Type      | Default | Description                                                              |
| ---------- | --------- | ------- | ------------------------------------------------------------------------ |
| `multiple` | `boolean` | `true`  | Whether multiple items can have this flag set (false = single selection) |

## Return Value

| Name        | Type                                        | Description                                              |
| ----------- | ------------------------------------------- | -------------------------------------------------------- |
| `items`     | `ComputedRef<CollectionItem[]>`             | Array of collection items with flags and properties      |
| `useSubset` | `(filter: (item) => boolean) => Collection` | Creates a new collection that's a subset of the original |
| `useFlag`   | `(flag: TFlag) => UseFlag`                  | Utilities for working with a specific flag               |
| `setFlag`   | Overloaded function (see below)             | Set flag on one or multiple items                        |

### `CollectionItem` object

| Name         | Type                           | Description                                             |
| ------------ | ------------------------------ | ------------------------------------------------------- |
| `id`         | `TId`                          | Unique identifier for the item                          |
| `source`     | `TSource`                      | The original source object                              |
| `flags`      | `Record<TFlag, boolean>`       | Object containing the state of all flags for this item  |
| `properties` | `TProperties`                  | Object containing all computed properties for this item |
| `toggleFlag` | `(flag, forcedValue?) => void` | Method to toggle a flag on this item                    |

### Return value of `useFlag(flag)`

| Name        | Type                            | Description                                            |
| ----------- | ------------------------------- | ------------------------------------------------------ |
| `items`     | `ComputedRef<CollectionItem[]>` | Array of items that have this flag set                 |
| `ids`       | `ComputedRef<TId[]>`            | Array of IDs of items that have this flag set          |
| `count`     | `ComputedRef<number>`           | Number of items that have this flag set                |
| `areAllOn`  | `ComputedRef<boolean>`          | Whether all items in the collection have this flag set |
| `areSomeOn` | `ComputedRef<boolean>`          | Whether at least one item has this flag set            |
| `areNoneOn` | `ComputedRef<boolean>`          | Whether no items have this flag set                    |
| `toggle`    | `(forcedValue?) => void`        | Toggle this flag on all items in the collection        |

## Flag Operations

The composable provides several ways to work with flags:

### Setting Flags

The `setFlag` function has two different signatures:

```typescript
// Signature 1: Set flag for specific items
function setFlag(id: MaybeArray<TId>, flag: TFlag, value: boolean): void

// Signature 2: Set flag for all items in the collection
function setFlag(flag: TFlag, value: boolean): void
```

Examples:

```typescript
// Set flag for a single item
setFlag('item-id', 'selected', true)

// Set flag for multiple items
setFlag(['item1-id', 'item2-id'], 'selected', true)

// Set flag for all items in the collection
setFlag('selected', true)
```

A flag can also be set directly on the item

```typescript
item.flags.selected = true
```

### Toggling Flags

You can toggle flags using the `toggleFlag` method on an individual item:

```typescript
// Toggle the 'selected' flag on an item
// Same as item.flags.selected = !item.flags.selected
item.toggleFlag('selected')

// Force the 'selected' flag to a specific value
// Same as item.flags.selected = true
item.toggleFlag('selected', true)
```

### Checking Flags

You can check if an item has a flag:

```typescript
// Check if an item has a specific flag
const isSelected = item.flags.selected
```

## Examples

### Basic Usage

```typescript
// Define a source type
interface User {
  id: string
  firstName: string
  lastName: string
  status: 'active' | 'inactive'
  role: 'admin' | 'user'
}

// Create a ref with source data
const users = ref<User[]>([
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    status: 'active',
    role: 'admin',
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    status: 'active',
    role: 'user',
  },
  {
    id: '3',
    firstName: 'Bob',
    lastName: 'Johnson',
    status: 'inactive',
    role: 'user',
  },
])
```

```typescript
// Create a collection
const { items, useFlag, setFlag } = useCollection(users, {
  identifier: user => user.id,
  flags: ['selected', { active: { multiple: false } }],
  properties: user => ({
    fullName: computed(() => `${user.firstName} ${user.lastName}`),
    isAdmin: computed(() => user.role === 'admin'),
  }),
})

// Work with the collection
const selectedUsers = useFlag('selected')
```

```vue
<template>
  <div>
    <div>Selected: {{ selectedUsers.count }}</div>
    <div>All selected: {{ selectedUsers.areAllOn }}</div>
    <button @click="selectedUsers.toggle()">Toggle All</button>
    <button @click="setFlag('selected', false)">Clear Selection</button>

    <ul>
      <li v-for="item in items" :key="item.id">
        <input type="checkbox" v-model="item.flags.selected" />
        {{ item.properties.fullName }}
        <span v-if="item.properties.isAdmin">(Admin)</span>
      </li>
    </ul>
  </div>
</template>
```

### Using Subsets

```typescript
const { items, useSubset, useFlag } = useCollection(users, {
  identifier: user => user.id,
  flags: ['selected'],
  properties: user => ({
    isActive: computed(() => user.status === 'active'),
  }),
})

// Create a subset of only active users
const activeCollection = useSubset(item => item.properties.isActive)
const selectedActiveUsers = activeCollection.useFlag('selected')

const activeCount = computed(() => activeCollection.items.value.length)
const selectedActiveCount = computed(() => selectedActiveUsers.count.value)
```

```vue
<template>
  <div>
    <p>{{ activeCount }} active users</p>
    <p>{{ selectedActiveCount }} selected active users</p>
  </div>
</template>
```

### Exclusive Selection

```typescript
const { items, setFlag } = useCollection(users, {
  identifier: user => user.id,
  flags: [{ current: { multiple: false } }],
})
```

```vue
<template>
  <ul>
    <li
      v-for="item in items"
      :key="item.id"
      :class="{ selected: item.flags.current }"
      @click="setFlag(item.id, 'current', true)"
    >
      {{ item.source.firstName }}
    </li>
  </ul>
</template>

<style>
.selected {
  background-color: #eaf2f8;
  font-weight: bold;
}
</style>
```
