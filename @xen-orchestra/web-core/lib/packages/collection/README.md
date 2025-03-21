# `useCollection` composable

The `useCollection` composable helps you manage a collection of items with flags (boolean states) and computed properties. It provides a type-safe way to filter, flag, and manipulate items in a collection.

## Usage

```typescript
const { items, useSubset, useFlag } = useCollection(sources, {
  identifier: source => source.id,
  flags: 'selected',
  properties: source => ({
    isAvailable: computed(() => source.status === 'available'),
    fullName: computed(() => `${source.firstName} ${source.lastName}`),
  }),
})
```

## Core Concepts

- **Collection Item**: An object with a unique identifier, a reference to its source object, flags, computed properties, and methods to manipulate flags
- **Flags**: Boolean states attached to items (like 'selected', 'active', 'highlighted')
- **Properties**: Computed values derived from the source object

## `useCollection` parameters

| Name      | Type                              | Required | Description                                          |
| --------- | --------------------------------- | :------: | ---------------------------------------------------- |
| `sources` | `MaybeRefOrGetter<TSource[]>`     |    ✓     | Array of source objects for the collection           |
| `options` | `CollectionOptions<TSource, TId>` |    ✓     | Configuration options for the collection (see below) |

### `options` object

| Name         | Type                                               | Required | Description                                                             |
| ------------ | -------------------------------------------------- | :------: | ----------------------------------------------------------------------- |
| `identifier` | `(source: TSource) => TId`                         |    ✓     | Function to extract a unique identifier from each source                |
| `flags`      | `MaybeArray<string \| Record<string, FlagConfig>>` |          | Flags that can be applied to items in the collection                    |
| `properties` | `(source: TSource) => Record<string, ComputedRef>` |          | Function that returns computed properties for each item                 |
| `context`    | `Reactive<{ flags, registeredFlags }>`             |          | Shared context for multiple collections (usually handled automatically) |

### `FlagConfig` object

| Name       | Type      | Default | Description                                                              |
| ---------- | --------- | ------- | ------------------------------------------------------------------------ |
| `multiple` | `boolean` | `true`  | Whether multiple items can have this flag set (false = single selection) |
| `default`  | `boolean` | `false` | Default value for the flag when not explicitly set                       |

## Return Value

| Name        | Type                                        | Description                                                                   |
| ----------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| `items`     | `ComputedRef<CollectionItem[]>`             | Array of collection items with flags and properties                           |
| `useSubset` | `(filter: (item) => boolean) => Collection` | Creates a new collection that's a subset of the original, with shared context |
| `useFlag`   | `(flag: TFlag) => object`                   | Utilities for working with a specific flag (see below)                        |

### `CollectionItem` object

| Name         | Type                           | Description                                             |
| ------------ | ------------------------------ | ------------------------------------------------------- |
| `id`         | `TId`                          | Unique identifier for the item                          |
| `source`     | `TSource`                      | The original source object                              |
| `flags`      | `Record<TFlag, boolean>`       | Object containing the state of all flags for this item  |
| `properties` | `TProperties`                  | Object containing all computed properties for this item |
| `toggleFlag` | `(flag, forcedValue?) => void` | Method to toggle a flag on this item                    |

### Return value of `useFlag`

| Name        | Type                            | Description                                            |
| ----------- | ------------------------------- | ------------------------------------------------------ |
| `items`     | `ComputedRef<CollectionItem[]>` | Array of items that have this flag set                 |
| `ids`       | `ComputedRef<TId[]>`            | Array of IDs of items that have this flag set          |
| `count`     | `ComputedRef<number>`           | Number of items that have this flag set                |
| `areAllOn`  | `ComputedRef<boolean>`          | Whether all items in the collection have this flag set |
| `areSomeOn` | `ComputedRef<boolean>`          | Whether at least one item has this flag set            |
| `areNoneOn` | `ComputedRef<boolean>`          | Whether no items have this flag set                    |
| `toggle`    | `(forcedValue?) => void`        | Toggle this flag on all items in the collection        |

## Examples

### Basic Usage

```typescript
// Source type
interface User {
  id: string
  firstName: string
  lastName: string
  status: 'active' | 'inactive'
  role: 'admin' | 'user'
}

// Source data
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

// Create a collection
const { items: userItems, useFlag } = useCollection(users, {
  identifier: user => user.id,
  flags: ['selected', 'active'],
  properties: user => ({
    fullName: computed(() => `${user.firstName} ${user.lastName}`),
    isAdmin: computed(() => user.role === 'admin'),
  }),
})

// Work with a specific flag
const { areAllOn: areAllUsersSelected, count: selectedUsersCount, toggle: toggleAllSelectedUsers } = useFlag('selected')
```

```vue
<!-- Basic usage in a template -->
<template>
  <div>
    <div>Selected: {{ selectedUsersCount }}</div>
    <div>All selected: {{ areAllUsersSelected }}</div>
    <button @click="toggleAllSelectedUsers()">Toggle All</button>

    <ul>
      <li v-for="user in userItems" :key="user.id">
        <input type="checkbox" v-model="user.flags.selected" />
        {{ user.properties.fullName }}
        <span v-if="user.properties.isAdmin">(Admin)</span>
      </li>
    </ul>
  </div>
</template>
```

### Using Subsets

```typescript
const { items: userItems, useSubset } = useCollection(users, {
  identifier: user => user.id,
  flags: ['selected'],
  properties: user => ({
    isActive: computed(() => user.status === 'active'),
  }),
})

// Create a subset of only active users
const { items: activeUserItems, useFlag: useActiveUsersFlag } = useSubset(item => item.properties.isActive)

// Work with a specific flag on the subset
const { count: selectedActiveUsersCount } = useActiveUsersFlag('selected')

// Now you can work with just the active users
console.log(`${activeUserItems.value.length} active users`)
console.log(`${selectedActiveUsersCount.value} selected active users`)
```

### Exclusive Selection (Radio Button Behavior)

```typescript
const { items } = useCollection(users, {
  identifier: user => user.id,
  flags: {
    current: { multiple: false },
  },
})
```

When an item activate its `current` flag, it is deactivated on every other items

```vue
<template>
  <MyComponent v-for="item in items" :key="item.id" :current="item.flags.current" @click="items.flags.current = true">
    {{ item.source.firstName }}
  </MyComponent>
</template>
```
