# Table System

Table system that separates data logic from presentation through reusable renderers.

## Understanding Renderers

A **renderer** is a function that creates a VNode for a specific part of the table (cell, row, or table). When you define a renderer, you specify:

1. **Component**: The Vue component to render (loaded asynchronously)
2. **Props function** (optional): Default props based on configuration
3. **Extensions** (optional): Named categories of additional functionality

### Props System

The `props` parameter is a function that receives an optional typed config and returns default props:

```typescript
const TextBody = defineTableCellRenderer({
  component: () => import('./TextCell.vue'),
  props: (config: { text: string }) => ({ data: config.text }),
  //      ^ This config type will be enforced when using the renderer
})

// Usage - TypeScript knows you need to provide `text`
TextBody({ text: 'Hello' })
```

When you use the renderer, you can:

- Provide the expected config to satisfy the `props` function
- Add additional props that will be merged
- Override default props

```typescript
// The renderer merges:
// 1. Props from the props function: { text: 'Hello' }
// 2. Additional/override props: { class: 'custom' }
TextBody({
  text: 'Hello', // Used by props function
  props: {
    // Additional or override props
    class: 'custom',
  },
})
```

### Extensions System

Extensions work like the `props` function but are optional and named. Each extension:

- Has a unique name (like `selectable`, `highlightable`)
- Receives typed configuration
- Returns the extension arguments (only `props` for now) to merge into the component

```typescript
const MyRow = defineTableRowRenderer({
  component: () => import('./Row.vue'),
  extensions: {
    selectable: (config: { id: string; selectedId: Ref<string | null> }) => ({
      props: {
        selected: config.id === config.selectedId.value,
      },
    }),
    highlightable: (config: { isHighlighted: boolean }) => ({
      props: {
        highlighted: config.isHighlighted,
      },
    }),
  },
})

// Usage - provide config for the extensions you want to use
MyRow({
  cells: () => [...],
  extensions: {
    selectable: { id: user.id, selectedId },
    highlightable: { isHighlighted: true },
  }
})
```

Extensions are optional when using the renderer - you only provide the ones you need.

## Defining Renderers

### Cell Renderers

Create header and body cell renderers:

```typescript
import { defineTableCellRenderer } from '@core/packages/table'

const TextHeader = defineTableCellRenderer({
  component: () => import('./VtsHeaderCell.vue'),
  props: (config: { label: string }) => ({
    label: config.label,
    icon: icon('fa:align-left'),
  }),
})

const TextBody = defineTableCellRenderer({
  component: () => import('./body-cells/VtsTextCell.vue'),
  props: (config: { text: string | number }) => ({ text: config.text }),
})

// Usage
TextHeader({ label: 'Name' })
TextBody({ text: user.name })
```

### Row Renderers

Create row renderer:

```typescript
import { defineTableRowRenderer } from '@core/packages/table'

const DefaultRow = defineTableRowRenderer({
  component: () => import('./VtsRow.vue'),
})

DefaultRow({
  cells: () => [...]
})
```

### Table Renderers

Create table renderer:

```typescript
import { defineTableRenderer } from '@core/packages/table'

const DefaultTable = defineTableRenderer({
  component: () => import('./VtsTableNew.vue'),
})

// Usage
DefaultTable({
  thead: MyThead(...),
  // thead: { rows: () => [...] },  // to use native "thead"
  // thead: { cells: () => [...] }, // to use native "thead" + "tr",
  tbody: MyTBody(...),
  // tbody: { rows: () => [...] }, // to use native "tbody"
})
```

## Building Tables

### Column Definition

Use `defineColumns` to create columns configuration.

```typescript
const columns = defineColumns({
  name: {
    header: () => TextHeader({ label: 'Name' }),
    body: user => TextBody({ text: user.name }),
  },
  email: {
    header: () => TextHeader({ label: 'Email' }),
    body: user => TextBody({ text: user.email }),
  },
  // Conditional column
  role: isAdmin
    ? {
        header: () => TextHeader({ label: 'Role' }),
        body: user => TextBody({ text: user.role }),
      }
    : undefined,
})
```

`header` and `body` can also take a config parameter if needed:

```typescript
const columns = defineColumns({
  name: {
    header: (config) => TextHeader(...),
    body: (user, config) => TextBody(...),
  },
})
```

```typescript
// API
columns.getHeaderCells(config?) // Array of header cell VNodes
columns.getBodyCells(user, config?) // Array of body cell VNodes for a row
columns.toggleColumn('name') // Toggle column visibility
columns.toggleColumn('name', true) // Force column visibility
columns.visibleColumnsCount // ComputedRef<number>, useful for colspan
```

### Table Definition

Use one of three table definition functions:

#### Define basic single-source table: `defineTable`

```typescript
const { getHeaderCells, getBodyCells } = defineColumns(...)

const useUserTable = defineTable((sources: ComputedRef<User[]>) =>
  () => DefaultTable({
    thead: {
      cells: () => getHeaderCells()
    },
    tbody: {
      rows: () => sources.value.map(user =>
        DefaultRow({
          cells: () => getBodyCells(user)
        })
      )
    },
  })
)
```

```typescript
// Usage
const users = ref<User[]>([...])

const table = useUserTable(users, {})
```

`defineTable` setup function can also define a config parameter as second argument:

```typescript
const useUserTable = defineTable((sources: ComputedRef<User[]>, config: { needThis: string }) => ...)

const table = useUserTable(users, { needThis: 'value' })
```

#### Define type-discriminated table: `defineTypedTable`

```typescript
type Source = { type: 'user'; sources: ComputedRef<User[]> } | { type: 'admin'; sources: ComputedRef<Admin[]> }

const useItemTable = defineTypedTable(({ type, sources }: Source) => {
  // If type === 'user', sources is ComputedRef<User[]>
  // If type === 'admin', sources is ComputedRef<Admin[]>

  return () => DefaultTable({...})
})

// Usage
useItemTable('admin', admins, {})
```

#### Define multiple sources table: `defineMultiSourceTable`

```typescript
type Sources = {
  users: ComputedRef<User[]>
  admins: ComputedRef<Admin[]>
}

const useDashboard = defineMultiSourceTable((sources: Sources) => {
  // sources.users: ComputedRef<User[]>
  // sources.admins: ComputedRef<Admin[]>

  return () => DefaultTable({...})
})

// Usage
useDashboard({ users, admins }, {})
```

### Source Transformation

When using a defined table, if passed sources doesn't match expected sources, then a `transform` config will be required to add missing or incorrectly typed properties:

```typescript
type User = {
  id: string
  fullName: string
}

const useUserTable = defineTable((sources: ComputedRef<User[]>) => {})

// Raw data has different shape
interface RawUser {
  uuid: string
  firstName: string
  lastName: string
}

// Transform is required when types don't match
useUserTable(rawUsers, {
  transform: user => ({
    id: user.uuid,
    fullName: `${user.firstName} ${user.lastName}`,
  }),
})

// Transform is optional when types already match
useUserTable(users, {})
```

## Rendering the table

```vue
<template>
  <MyUsersTable />
</template>

<script setup lang="ts">
const MyUsersTable = useUsersTable(users, {})
</script>
```

## Props

When a table is rendered, each element's props will be merged together in the following order:

1. Props from the renderer `props` function
2. Props from extensions `props` functions
3. Props provided when using the renderer

They will be merged with Vue's default merging strategy (for example, `class` and `style` will be concatenated).

## API Reference

### Renderer Functions

- `defineTableRenderer` - Define table wrapper (`table`)
- `defineTableSectionRenderer` - Define table sections (`thead` / `tbody`)
- `defineTableRowRenderer` - Define table rows (`tr`)
- `defineTableCellRenderer` - Define table cells (`th` / `td`)

### Table Functions

- `defineTable` - Single source table
- `defineTypedTable` - Type-discriminated table
- `defineMultiSourceTable` - Multiple sources table
- `defineColumns` - Column definitions
