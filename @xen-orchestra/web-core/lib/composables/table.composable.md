# `useTable` composable

## Usage

```ts
const { columns, visibleColumns, rows, columnsById } = useTable('<table-id>', records, {
  rowId: record => record.id,
  columns: define => [
    define('<column-id>', { label: 'Column 1' }),
    define('<column-id>', { label: 'Column 2' }),
    define('<column-id>', { label: 'Column 3' }),
  ],
})
```

## `useTable` options

| Name      | Type                                           | Required | Description                                       |
| --------- | ---------------------------------------------- | :------: | ------------------------------------------------- |
| `rowId`   | `(record: TRecord) => string`                  |    ✓     | A function that define the id of a row.           |
| `columns` | `(define: DefineColumn) => ColumnDefinition[]` |    ✓     | A function that defines the columns of the table. |

## Defining a column

```ts
define('<TColumnId>', options) // TValue will be TRecord[TColumnId]
define('<TColumnId>', `<TProperty>`, options) // TValue will be TRecord[TProperty]
define('<TColumnId>', (record: TRecord) => '<TValue>', options) // TValue will be the result of the function
```

### Column options

| Name         | Type                               | Required | Default | Description                            |
| ------------ | ---------------------------------- | :------: | ------- | -------------------------------------- |
| `label`      | `string`                           |    ✓     |         | The column label.                      |
| `isHideable` | `boolean`                          |          | `true`  | Indicates if the column can be hidden. |
| `compareFn`  | `(a: TValue, b: TValue) => number` |          |         | A function used to compare the values. |

## `columns`

An array containing all columns defined in the table.

### Properties of a column

| Name         | Type                          | Description                                      |
| ------------ | ----------------------------- | ------------------------------------------------ |
| `id`         | `string`                      | The column id.                                   |
| `label`      | `string`                      | The column label.                                |
| `isVisible`  | `boolean`                     | Indicates if the column is visible.              |
| `getter`     | `(record: TRecord) => TValue` | A function that returns the value of the column. |
| `isSortable` | `boolean`                     | Indicates if the column is sortable.             |
| `isHideable` | `boolean`                     | Indicates if the column is hideable.             |

#### If `isSortable` is `true`

| Name                                    | Type                                             | Description                                                                               |
| --------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `compareFn`                             | `(a: TValue, b: TValue) => number`               | The compare function defined in the column options.                                       |
| `isSorted`                              | `boolean`                                        | Indicates if the column is sorted.                                                        |
| `isSortedAsc`                           | `boolean`                                        | Indicates if the column is sorted in ascending order.                                     |
| `isSortedDesc`                          | `boolean`                                        | Indicates if the column is sorted in descending order.                                    |
| `sort`                                  | `(direction, toggleOffIfSameDirection?) => void` | A function that sorts the rows based on the column values.                                |
| &nbsp;⤷&nbsp;`direction`                | `'asc' \| 'desc' \| false`                       | The sort direction. If `false`, the column is unsorted.                                   |
| &nbsp;⤷&nbsp;`toggleOffIfSameDirection` | `boolean`                                        | Indicates if the column should be unsorted if it is already sorted in the same direction. |
| `sortAsc`                               | `(toggleOffIfSameDirection?) => void`            | A function that sorts the rows based on the column values in ascending order.             |
| &nbsp;⤷&nbsp;`toggleOffIfSameDirection` | `boolean`                                        | Indicates if the column should be unsorted if it is already sorted in ascending order.    |
| `sortDesc`                              | `(toggleOffIfSameDirection?) => void`            | A function that sorts the rows based on the column values in descending order.            |
| &nbsp;⤷&nbsp;`toggleOffIfSameDirection` | `boolean`                                        | Indicates if the column should be unsorted if it is already sorted in descending order.   |

#### If `isHideable` is `true`

| Name                 | Type                        | Description                                                                     |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------- |
| `hide`               | `() => void`                | A function that hides the column.                                               |
| `show`               | `() => void`                | A function that shows the column.                                               |
| `toggle`             | `(value?: boolean) => void` | A function that toggles the visibility of the column.                           |
| &nbsp;⤷&nbsp;`value` | `boolean \| undefined`      | If undefined, the visibility will be toggled. Else it will be set to the value. |

## `visibleColumns`

Same as `columns` but only contains the visible columns.

## `rows`

An array containing all rows of the table.

### Properties of a row

| Name             | Type       | Description                     |
| ---------------- | ---------- | ------------------------------- |
| `id`             | `string`   | The row id.                     |
| `value`          | `TRecord`  | The record of the row.          |
| `visibleColumns` | `Column[]` | The visible columns of the row. |

#### `visibleColumns`

An array containing the visible columns of the row.

##### Properties of a row column

| Name    | Type     | Description              |
| ------- | -------- | ------------------------ |
| `id`    | `string` | The column id.           |
| `value` | `TValue` | The value of the column. |

## `columnsById`

An object containing all columns defined in the table indexed by their id.

## Example

```vue
<template>
  <div>
    <button v-for="column of columns" :key="column.id" @click.prevent="column.toggle()">
      {{ column.isVisible ? 'Hide' : 'Show' }} {{ column.label }}
    </button>
  </div>
  <table>
    <thead>
      <tr>
        <th v-for="column of visibleColumns" :key="column.id">
          {{ column.label }}
          <button v-if="column.isHideable" @click.prevent="column.hide()">Hide</button>
          <template v-if="column.isSortable">
            <button @click.prevent="column.sortAsc(true)">Sort ASC</button>
            <button @click.prevent="column.sortDesc(true)">Sort DESC</button>
          </template>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row of rows" :key="row.id">
        <td v-for="column of row.visibleColumns" :key="column.id">
          {{ column.value }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts" setup>
const { columns, visibleColumns, rows } = useTable(
  'users',
  [
    { id: 1, name: 'John', age: 25 },
    { id: 2, name: 'Jane', age: 30 },
    { id: 3, name: 'Alice', age: 20 },
  ],
  {
    rowId: record => record.id,
    columns: define => [
      define('name', { label: 'Name', isHideable: false }),
      define('age', { label: 'Age', compareFn: (user1, user2) => user1.age - user2.age }),
    ],
  }
)
</script>
```
