# `useFormOptions` composable

This composable manages a collection of filterable form options to be used with `VtsSelect` component.

## Usage

```typescript
const { searchTerm, options, selectedOptions, selectedValues } = useFormOptions(entries, {
  getValue: entry => entry.id,
  getLabel: entry => entry.name,
  getSearchableTerm: entry => [entry.name, entry.code],
  getDisabled: entry => entry.state == 'offline',
  multiple: false,
})
```

## Parameters

|           | Required | Type                                   | Default | Description                                              |
| --------- | :------: | -------------------------------------- | ------- | -------------------------------------------------------- |
| `entries` |    ✓     | `MaybeRefOrGetter<TEntry[]>`           |         | Array of entry objects to be converted into form options |
| `config`  |    ✓     | `UseFormOptionsConfig<TEntry, TValue>` |         | Configuration for how to extract values, labels, etc.    |

### `config` object

|                     | Required | Type                                    | Default       | Description                                                             |
| ------------------- | :------: | --------------------------------------- | ------------- | ----------------------------------------------------------------------- |
| `getValue`          |    ✓     | `(entry: TEntry) => TValue`             |               | Function that extracts a unique value/ID from each entry                |
| `getLabel`          |    ✓     | `(entry: TEntry) => string`             |               | Function that extracts a human-readable label from each entry           |
| `getSearchableTerm` |          | `(entry: TEntry) => MaybeArray<string>` | Same as label | Function that extracts searchable term(s) from each entry for filtering |
| `getDisabled`       |          | `(entry: TEntry) => boolean`            | `false`       | Function that determines if an entry should be disabled                 |
| `multiple`          |          | `boolean`                               | `false`       | Whether multiple options can be selected simultaneously                 |

## Return Value

|                   | Type                        | Description                                          |
| ----------------- | --------------------------- | ---------------------------------------------------- |
| `searchTerm`      | `Ref<string>`               | Reactive reference to control the search/filter term |
| `allOptions`      | `ComputedRef<FormOption[]>` | All options, regardless of search filtering          |
| `options`         | `ComputedRef<FormOption[]>` | Options filtered by the current search term          |
| `selectedOptions` | `ComputedRef<FormOption[]>` | Options that are currently selected                  |
| `selectedValues`  | `ComputedRef<TValue[]>`     | Values of options that are currently selected        |

## `FormOption` object

Each item in the `options` array is a `FormOption` object with these properties:

|                         | Type                                     | Description                                            |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------ |
| `id`                    | `TValue`                                 | Unique identifier for the option (from `getValue`)     |
| `source`                | `TEntry`                                 | The original source object                             |
| `flags`                 | `{ selected: boolean, active: boolean }` | State flags for selection and keyboard navigation      |
| `properties`            | `object`                                 | Computed properties for the option                     |
| &nbsp;⤷&nbsp;`label`    | `string`                                 | Human-readable option label (from `getLabel`)          |
| &nbsp;⤷&nbsp;`matching` | `boolean`                                | Whether the option matches the current search term     |
| &nbsp;⤷&nbsp;`disabled` | `boolean`                                | Whether the option is disabled                         |
| &nbsp;⤷&nbsp;`multiple` | `boolean`                                | Whether multiple selection is enabled                  |
| `toggleFlag`            | `(flag, forcedValue?) => void`           | Method to toggle a flag (like 'selected') on this item |

## Example: Basic usage with `VtsSelect`

```vue
<template>
  <VtsSelect :options />
</template>

<script lang="ts" setup>
const { options, selectedValues } = useFormOptions(vms, {
  getValue: vm => vm.id,
  getLabel: vm => vm.name_label,
})
</script>
```

## Example: Searchable + multi-select

```vue
<template>
  <VtsSelect v-model:search="searchTerm" :options />
</template>

<script lang="ts" setup>
const { options, searchTerm, selectedValues } = useFormOptions(vms, {
  getValue: vm => vm.id,
  getLabel: vm => vm.name_label,
  multiple: true,
})
</script>
```
