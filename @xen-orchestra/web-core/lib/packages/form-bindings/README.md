# `useFormBindings` composable

`useFormBindings` generates reactive `v-model` bindings for each field of a reactive form data object, removing the need to manually write `modelValue`/`onUpdate:modelValue` props for every input.

## Usage

```typescript
const bindings = useFormBindings(formData)
```

## Parameters

| Argument | Type                                | Required | Description                                     |
| -------- | ----------------------------------- | :------: | ----------------------------------------------- |
| `source` | `T extends Record<string, unknown>` |    ✓     | A reactive object holding the form field values |

## Return Value

| Property    | Type                                                       | Description                                           |
| ----------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| `useField`  | `(key, metadata?) => ComputedRef<ModelBinding & metadata>` | Creates a binding, optionally merged with extra props |
| `useSelect` | `(id, metadata?) => ComputedRef<{ id } & metadata>`        | Creates a binding for a `VtsSelect`-like component    |

### `ModelBinding<T>` object

Each field binding is a computed object with:

| Property              | Type                 | Description                            |
| --------------------- | -------------------- | -------------------------------------- |
| `modelValue`          | `T`                  | The current value of the field         |
| `onUpdate:modelValue` | `(value: T) => void` | Setter — updates the field in `source` |

## `useField(key, metadata?)`

Returns the standard `ModelBinding` for the given key. Pass an optional `metadata` factory function to merge additional props into the binding (e.g. label, validation state, disabled state, etc.).

```typescript
// Without metadata
const nameBindings = bindings.useField('name')

// With metadata
const nameBindings = bindings.useField('name', () => ({
  label: t('name'),
  required: true,
}))
```

## `useSelect(id, metadata?)`

Returns a binding for a select component registered via `useFormSelect`. The `id` comes from the `useFormSelect` return value.

```typescript
const { id: poolSelectId } = useFormSelect(pools, { ... })

const poolSelectBindings = bindings.useSelect(poolSelectId)

// With metadata
const poolSelectBindings = bindings.useSelect(poolSelectId, () => ({
  label: t('pool'),
}))
```

## Example: With metadata (e.g. label + validation)

```vue
<template>
  <VtsInput v-bind="nameBindings" />
</template>

<script lang="ts" setup>
import { useFormBindings } from '@core/packages/form-bindings'
import { reactive } from 'vue'

const formData = reactive({ name: '' })

const { useField } = useFormBindings(formData)

const nameBindings = useField('name', () => ({
  label: 'Name',
  error: formData.name === '' ? 'Name is required' : undefined,
}))
</script>
```

## Example: With a select component

```typescript
import { useFormBindings } from '@core/packages/form-bindings'
import { useFormSelect } from '@core/packages/form-select'
import { reactive } from 'vue'

const formData = reactive({ pool: undefined as string | undefined })

const { id: poolSelectId } = useFormSelect(pools, {
  model: toRef(formData, 'pool'),
  option: { label: 'name_label', value: 'id' },
})

const { useSelect } = useFormBindings(formData)

const poolSelectBindings = useSelect(poolSelectId)
```
