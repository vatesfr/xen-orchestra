# `useCollection` composable

The
`useCollection` composable helps you manage a collection of items with flags (boolean states) and computed properties. It provides a type-safe way to filter, flag, and manipulate items in a collection.

## Usage

```typescript
const { items, useSubset, useFlag } = useCollection(sources, {
  flags: ['selected', 'active', { highlighted: { multiple: false } }],
  properties: source => ({
    id: source.theId, // Required if TSource doesn't have an `id` property
    isAvailable: source.status === 'available',
    fullName: `${source.firstName} ${source.lastName}`,
  }),
})
```

## Core Concepts

- **Collection Item**: An object with a unique identifier, a reference to its source object, flags, computed properties, and methods to manipulate flags
- **Flags**: Boolean states attached to items (like 'selected', 'active', 'highlighted')
- **Properties**: Additional custom values

## `useCollection` parameters

| Name      | Type                                             | Required | Description                                          |
| --------- | ------------------------------------------------ | :------: | ---------------------------------------------------- |
| `sources` | `MaybeRefOrGetter<TSource[]>`                    |    ✓     | Array of source objects for the collection           |
| `options` | `CollectionOptions<TSource, TFlag, TProperties>` |    ~     | Configuration options for the collection (see below) |

### `options` object

| Name         | Type                                           | Required | Description                                                           |
| ------------ | ---------------------------------------------- | :------: | --------------------------------------------------------------------- |
| `flags`      | `FlagsConfig<TFlag>`                           |          | Flags that can be applied to items in the collection                  |
| `properties` | `(source: TSource) => Record<string, unknown>` |    ~     | Function that returns additional properties for each item (see below) |

### Item ID

The item ID will be retrieved automatically from `TSource.id`

If `TSource` doesn't provide an `id`, then `options.properties` will be required and must return at least an `id`

### `FlagsConfig` type

```typescript
type FlagsConfig<TFlag extends string> = TFlag[] | { [K in TFlag]: { multiple?: boolean } }
```

Values for `multiple`:

- `true` (default): multiple items can share the same flag.
- `false`: only one item can have the flag at a time (exclusive selection). Setting the flag on one item will automatically unset it on all other items.

## Return Value

| Name        | Type                                        | Description                                         |
| ----------- | ------------------------------------------- | --------------------------------------------------- |
| `items`     | `ComputedRef<CollectionItem[]>`             | Array of collection items with flags and properties |
| `useSubset` | `(filter: (item) => boolean) => Collection` | Creates a sub collection matching the filter        |
| `useFlag`   | `(flag: TFlag) => UseFlagReturn`            | Utilities for working with a specific flag          |
| `count`     | `ComputedRef<number>`                       | Number of items in the collection                   |

### `CollectionItem` object

| Name         | Type                           | Description                                               |
| ------------ | ------------------------------ | --------------------------------------------------------- |
| `id`         | `TId`                          | Unique identifier for the item (string, number or symbol) |
| `source`     | `TSource`                      | The original source object                                |
| `flags`      | `Record<TFlag, boolean>`       | Object containing the state of all flags for this item    |
| `properties` | `TProperties`                  | Object containing all computed properties for this item   |
| `toggleFlag` | `(flag, forcedValue?) => void` | Method to toggle a flag on this item                      |

### UseFlagReturn object

| Name        | Type                                        | Description                                            |
| ----------- | ------------------------------------------- | ------------------------------------------------------ |
| `items`     | `ComputedRef<CollectionItem[]>`             | Array of items that have this flag set                 |
| `ids`       | `ComputedRef<TId[]>`                        | Array of IDs of items that have this flag set          |
| `count`     | `ComputedRef<number>`                       | Number of items that have this flag set                |
| `areAllOn`  | `ComputedRef<boolean>`                      | Whether all items in the collection have this flag set |
| `areSomeOn` | `ComputedRef<boolean>`                      | Whether at least one item has this flag set            |
| `areNoneOn` | `ComputedRef<boolean>`                      | Whether no items have this flag set                    |
| `toggle`    | `(id, forcedValue?) => void`                | Toggle this flag on a specific item                    |
| `toggleAll` | `(forcedValue?) => void`                    | Toggle this flag on all items in the collection        |
| `useSubset` | `(filter: (item) => boolean) => Collection` | Creates a sub collection matching the filter           |

## Flag Operations

The composable provides several ways to work with flags:

### Setting and Toggling Flags

You can work with flags directly on collection items:

```typescript
// Set flag for a single item
item.flags.selected = true

// Toggle the 'selected' flag on an item
// Same as item.flags.selected = !item.flags.selected
item.toggleFlag('selected')

// Force the 'selected' flag to a specific value
// Same as item.flags.selected = true
item.toggleFlag('selected', true)
```

You can also use the utilities provided by `useFlag`:

```typescript
// Get utilities for the 'selected' flag
const { toggle: toggleSelected, toggleAll: toggleAllSelected } = useFlag('selected')

// Toggle flag for a specific item
toggleSelected(itemId)

// Force flag to true for a specific item
toggleSelected(itemId, true)

// Toggle flag on all items
toggleAllSelected()

// Force all items to have the flag
toggleAllSelected(true)
```

### Checking Flags

You can check if an item has a flag:

```typescript
// Check if an item has a specific flag
const isSelected = item.flags.selected
```

## Example

```typescript
const {
  items: users,
  useSubset,
  count,
} = useCollection(rawUsers, {
  flags: ['selected'],
  properties: user => ({
    fullName: `${user.firstName} ${user.lastName} (${user.group})`,
  }),
})

const { items: admins, useFlag: useAdminFlag, count: adminCount } = useSubset(item => item.source.group === 'admin')

const {
  items: selectedAdmins,
  areAllOn: areAllAdminSelected,
  toggleAll: toggleAllAdminSelection,
  count: selectedAdminCount,
  toggle: toggleAdminSelection,
} = useAdminFlag('selected')
```

It's also possible to create a subset of subset:

```typescript
const { items: users, useSubset } = useCollection(rawUsers, {
  /* ... */
})

const { items: admins, useSubset: useAdminSubset } = useSubset(item => item.source.group === 'admin')

const { items: activeAdmins } = useAdminSubset(item => item.source.status === 'active')
```
