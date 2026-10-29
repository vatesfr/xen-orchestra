# `defineColumn`

Define the head and body renderers for a column.

The render functions can receive arguments and must return a VNode.

## Example 1 - A simple text column

```ts
const useTextColumn = defineColumn((config?: { headLabel?: string }) => ({
  renderHead: () => renderHeadCell(config?.headLabel),
  renderBody: (text: string) => h('td', { class: 'table-text-cell' }, text),
}))
```

## Example 2 - A "number with unit" column

```ts
const useNumberWithUnitColumn = defineColumn((config?: { headLabel?: string; defaultUnit?: string }) => ({
  renderHead: () => renderHeadCell(config?.headLabel),
  renderBody: (value: number, unit?: string) =>
    h(NumberCell, {
      value,
      suffix: unit ?? config?.defaultUnit,
    }),
}))
```

# `defineColumns`

Define a set of columns.

## Example

```ts
const useUserTableColumns = defineColumns(() => ({
  fullName: useTextColumn({ headLabel: 'Full name' }),
  email: useTextColumn({ headLabel: 'Email' }),
  age: useNumberWithUnitColumn({ headLabel: 'Age', defaultUnit: 'years' }),
}))
```

# Using the columns set

When using the columns set, you could have to provide `head` and/or `body` arguments based on whether any `renderHead` and/or `renderBody` used in the columns set expect arguments.

## Example

The `body` function receives the row item (here, a `User`) and returns an object where:

- **Keys** are column names (`fullName`, `email`, `age`)
- **Values** are functions that receive the column's original renderer (`r`) and must return a VNode

You can either use the original renderer by calling `r(data)`, or ignore it and return your own VNode.

```ts
const { HeadCells, BodyCells } = useUserTableColumns({
  body: (user: User) => ({
    fullName: r => r(`${user.firstName} ${user.lastName}`),
    email: r => r(user.email),
    age: r => (user.age < 2 ? r(toMonths(user.age), 'months') : r(user.age)),
  }),
})
```

```html
<template>
  <table>
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <tr v-for="user in users" :key="user.id">
        <BodyCells :item="user" />
      </tr>
    </tbody>
  </table>
</template>
```

# Sorting

Pass an optional `sort` object to make columns sortable:

- **Keys** are column ids. Columns without a key aren't sortable.
- **Values** are compare functions receiving two row items (same type as the `body` item), following the `Array.prototype.sort` contract.

A sortable column's header opens a menu to sort ascending or descending. Only one column is sorted at a time, and hiding the sorted column removes the sort.

The sort menu is rendered by `VtsHeaderCell` (what `renderHeadCell` from `@core/tables/helpers/render-head-cell.ts` renders). A head that doesn't render it, such as a plain `<th>` or a `head` override that ignores the renderer, won't be sortable.

`sortItems` returns a sorted copy and doesn't own the rows: apply it before pagination, if any.

```ts
const { HeadCells, BodyCells, sortItems } = useUserTableColumns({
  body: (user: User) => ({
    fullName: r => r(`${user.firstName} ${user.lastName}`),
    email: r => r(user.email),
    age: r => (user.age < 2 ? r(toMonths(user.age), 'months') : r(user.age)),
  }),
  sort: {
    email: (user1, user2) => user1.email.localeCompare(user2.email),
    age: (user1, user2) => user1.age - user2.age,
  },
})

const sortedUsers = computed(() => sortItems(users.value))
```
