# `useFormSelect` composable

This composable manages a collection of filterable form options to be used with `VtsSelect` component.

## Usage

```typescript
const { searchTerm, options, selectedOptions, selectedValues } = useFormSelect(sources, {
  properties: source => ({
    value: source.id, // optional if source has a `value` or `ìd` property
    label: source.name, // optional if source has a `label` property
    searchableTerm: [source.name, source.code], // optional, defaults to the label
    disabled: source.state == 'offline', // optional, defaults to false
  }),
  multiple: false,
})
```

## Parameters

|           | Required | Type                          | Default | Description                                               |
| --------- | :------: | ----------------------------- | ------- | --------------------------------------------------------- |
| `sources` |    ✓     | `MaybeRefOrGetter<TSource[]>` |         | Array of source objects to be converted into form options |
| `config`  |    ✓     | (see below)                   |         | Configuration                                             |

### `config` object

|                             | Required | Type                                                       | Default         | Description                                                                             |
| --------------------------- | :------: | ---------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------- |
| `properties`                |    ~     | Record<string, unknown>                                    |                 | Object containing custom properties for each option                                     |
| `properties.value`          |    ~     | `TValue`                                                   |                 | A unique value for each option. Required if `TSource` doesn't have an `id` or `value`   |
| `properties.label`          |    ~     | `string`                                                   |                 | A human-readable label for each option. Required if `TSource` doesn't have a `label`    |
| `properties.searchableTerm` |          | `MaybeArray<string>`                                       | Same as `label` | Searchable term(s) for each option for filtering                                        |
| `properties.disabled`       |          | `boolean`                                                  | `false`         | Determines if an option should be disabled                                              |
| `multiple`                  |          | `boolean`                                                  | `false`         | Whether multiple options can be selected simultaneously                                 |
| `selectedLabel`             |          | `(count: number, labels: string[]) => string \| undefined` |                 | Function to format the label for selected options. Default label is `labels.join(', ')` |

## Return Value

|                   | Type                        | Description                                          |
| ----------------- | --------------------------- | ---------------------------------------------------- |
| `searchTerm`      | `Ref<string>`               | Reactive reference to control the search/filter term |
| `allOptions`      | `ComputedRef<FormOption[]>` | All options, regardless of search filtering          |
| `options`         | `ComputedRef<FormOption[]>` | Options filtered by the current search term          |
| `selectedOptions` | `ComputedRef<FormOption[]>` | Options that are currently selected                  |
| `selectedValues`  | `ComputedRef<TValue[]>`     | Values of options that are currently selected        |
| `selectedLabel`   | `ComputedRef<string>`       | Label for the selected options                       |

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
  <VtsSelect :options :selected-label />
</template>

<script lang="ts" setup>
const { options, selectedLabel, selectedValues } = useFormOptions(vms, {
  properties: vm => ({
    label: vm.name_label,
  }),
})
</script>
```

## Example: Searchable + multi-select + custom selected label

```vue
<template>
  <VtsSelect v-model:search="searchTerm" :options :selected-label />
</template>

<script lang="ts" setup>
const { options, searchTerm, selectedValues, selectedLabel } = useFormOptions(vms, {
  properties: vm => ({ label: vm.name_label }),
  multiple: true,
  selectedlabel: count => (count > 3 ? `${count} VMs selected` : undefined), // Keep the default label if less than 3
})
</script>
```
