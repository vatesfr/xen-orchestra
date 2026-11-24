# `useFormSelect` composable

This composable manages a collection of filterable form options to be used with `VtsSelect` component.

## Usage

```typescript
const { id, selectedValue } = useFormSelect(sources, {
  model: selectedSourceId, // optional, kept in sync with the selection
  option: {
    value: 'id', // optional if the source has a `value` or `id` property
    label: 'name', // optional if the source has a `label` property
    disabled: source => source.status === 'offline', // optional, defaults to false
  },
  placeholder: 'Select an item',
  searchable: true,
})
```

`useFormSelect` provides the select under its `id`: render it with `<VtsSelect :id accent="neutral" />` in the same component or below it.

## Parameters

|           | Required | Type                          | Default | Description                                               |
| --------- | :------: | ----------------------------- | ------- | --------------------------------------------------------- |
| `sources` |    ✓     | `MaybeRefOrGetter<TSource[]>` |         | Array of source objects to be converted into form options |
| `config`  |          | (see below)                   |         | Configuration                                             |

### `config` object

|                         | Required | Type                                                              | Default         | Description                                                                  |
| ----------------------- | :------: | ----------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------- |
| `model`                 |          | `Ref<unknown>`                                                    |                 | Value (or values with `multiple`) kept in sync with the selection, both ways |
| `multiple`              |          | `MaybeRefOrGetter<boolean>`                                       | `false`         | Whether multiple options can be selected simultaneously                      |
| `disabled`              |          | `MaybeRefOrGetter<boolean>`                                       | `false`         | Whether the whole select is disabled                                         |
| `required`              |          | `MaybeRefOrGetter<boolean>`                                       | `false`         | Whether the select is required                                               |
| `loading`               |          | `MaybeRefOrGetter<boolean>`                                       | `false`         | Whether the options are still loading                                        |
| `searchable`            |          | `MaybeRefOrGetter<boolean>`                                       | `false`         | Whether the dropdown shows a search input                                    |
| `placeholder`           |          | `MaybeRefOrGetter<string>`                                        | `''`            | Placeholder of the select                                                    |
| `searchPlaceholder`     |          | `MaybeRefOrGetter<string>`                                        | `''`            | Placeholder of the search input                                              |
| `selectedLabel`         |          | `(count: number, labels: string[]) => string \| undefined`        |                 | Formats the label of the selection. Defaults to `labels.join(', ')`          |
| `emptyOption`           |          | `MaybeRefOrGetter<{ value, label, selectedLabel?, properties? }>` |                 | An extra first option standing for "no value"                                |
| `option.id`             |          | `GetItemId<TSource>`                                              | Guessed         | Unique id of each option                                                     |
| `option.value`          |    ~     | `keyof TSource \| (source, properties, index) => TValue`          | Guessed         | Value of each option. Required if `TSource` has no `value` or `id`           |
| `option.label`          |    ~     | `keyof TSource \| (source, properties) => string`                 | Guessed         | Label of each option. Required if `TSource` has no `label`                   |
| `option.selectedLabel`  |          | `(source, properties) => string`                                  | Same as `label` | Label of the option once selected                                            |
| `option.disabled`       |          | `(source, properties) => boolean`                                 | `false`         | Whether an option is disabled                                                |
| `option.searchableTerm` |          | `(source, properties) => MaybeArray<string>`                      | Same as `label` | Searchable term(s) of each option                                            |
| `option.properties`     |          | `(source) => TCustomProperties`                                   |                 | Custom properties of each option, passed to the other `option` functions     |

## Return Value

|                                                                                                           | Type                        | Description                                              |
| --------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------- |
| `id`                                                                                                      | `FormSelectId`              | Key the select is provided under, to pass to `VtsSelect` |
| `searchTerm`                                                                                              | `Ref<string>`               | Reactive reference to control the search/filter term     |
| `allOptions`                                                                                              | `ComputedRef<FormOption[]>` | All options, regardless of search filtering              |
| `options`                                                                                                 | `ComputedRef<FormOption[]>` | Options filtered by the current search term              |
| `selectedOption`                                                                                          | `ComputedRef<FormOption>`   | First selected option                                    |
| `selectedOptions`                                                                                         | `ComputedRef<FormOption[]>` | Options that are currently selected                      |
| `selectedValue`                                                                                           | `ComputedRef<TValue>`       | Value of the first selected option                       |
| `selectedValues`                                                                                          | `ComputedRef<TValue[]>`     | Values of options that are currently selected            |
| `selectedLabel`                                                                                           | `ComputedRef<string>`       | Label for the selected options                           |
| `isMultiple`, `isDisabled`, `isRequired`, `isSearchable`, `isLoading`, `placeholder`, `searchPlaceholder` | `ComputedRef`               | The `config` values, resolved                            |

## `FormOption` object

Each item in the `options` array is a `FormOption` object with these properties:

|                         | Type                                     | Description                                            |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------ |
| `id`                    | `TValue`                                 | Unique identifier for the option (from `getValue`)     |
| `source`                | `TSource`                                | The original source object                             |
| `flags`                 | `{ selected: boolean, active: boolean }` | State flags for selection and keyboard navigation      |
| `properties`            | `object`                                 | Computed properties for the option                     |
| &nbsp;⤷&nbsp;`label`    | `string`                                 | Human-readable option label (from `getLabel`)          |
| &nbsp;⤷&nbsp;`matching` | `boolean`                                | Whether the option matches the current search term     |
| &nbsp;⤷&nbsp;`disabled` | `boolean`                                | Whether the option is disabled                         |
| &nbsp;⤷&nbsp;`multiple` | `boolean`                                | Whether multiple selection is enabled                  |
| &nbsp;⤷&nbsp;`...`      | `any`                                    | Any other custom property defined in the config        |
| `toggleFlag`            | `(flag, forcedValue?) => void`           | Method to toggle a flag (like 'selected') on this item |

## Example: Basic usage with `VtsSelect`

```vue
<template>
  <VtsSelect :id accent="neutral" />
</template>

<script lang="ts" setup>
const selectedItemId = ref<string>()

const { id } = useFormSelect(items, {
  model: selectedItemId,
  option: { label: 'name' },
})
</script>
```

## Example: Searchable + multi-select + custom selected label

```vue
<template>
  <VtsSelect :id accent="neutral" />
</template>

<script lang="ts" setup>
const selectedItemIds = ref<string[]>([])

const { id } = useFormSelect(items, {
  model: selectedItemIds,
  option: { label: 'name' },
  multiple: true,
  searchable: true,
  selectedLabel: count => (count > 3 ? `${count} items selected` : undefined), // Keeps the default label up to 3 items
})
</script>
```
