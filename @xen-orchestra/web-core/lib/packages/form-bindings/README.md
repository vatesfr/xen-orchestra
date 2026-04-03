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

The return value contains one `ComputedRef<ModelBinding<T[K]>>` per key in `source`, plus two helper functions:

| Property    | Type                                                   | Description                                           |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------- |
| `[key]`     | `ComputedRef<ModelBinding<T[K]>>`                      | Ready-to-spread binding for each field in `source`    |
| `useField`  | `(key, extras?) => ComputedRef<ModelBinding & extras>` | Creates a binding, optionally merged with extra props |
| `useSelect` | `(id, extras?) => ComputedRef<{ id } & extras>`        | Creates a binding for a `VtsSelect`-like component    |

### `ModelBinding<T>` object

Each field binding is a computed object with:

| Property              | Type                 | Description                            |
| --------------------- | -------------------- | -------------------------------------- |
| `modelValue`          | `T`                  | The current value of the field         |
| `onUpdate:modelValue` | `(value: T) => void` | Setter — updates the field in `source` |

## `useField(key, extras?)`

Returns the standard `ModelBinding` for the given key. Pass an optional `extras` factory function to merge additional props into the binding (e.g. for validation state, disabled state, etc.).

```typescript
// Without extras — equivalent to using the shorthand `bindings[key]`
const nameBindings = bindings.useField('name')

// With extras
const nameBindings = bindings.useField('name', () => ({
  error: v$.name.$error,
  disabled: isSubmitting.value,
}))
```

## `useSelect(id, extras?)`

Returns a binding for a select component registered via `useFormSelect`. The `id` comes from the `useFormSelect` return value.

```typescript
const { id: poolSelectId } = useFormSelect(pools, { ... })

const poolSelectBindings = bindings.useSelect(poolSelectId)

// With extras
const poolSelectBindings = bindings.useSelect(poolSelectId, () => ({
  disabled: isSubmitting.value,
}))
```

## Example: Basic form

```vue
<template>
  <input v-bind="name" />
  <input v-bind="description" />
  <input type="checkbox" v-bind="active" />
</template>

<script lang="ts" setup>
import { useFormBindings } from '@core/packages/form-bindings'
import { reactive } from 'vue'

const formData = reactive({
  name: '',
  description: '',
  active: false,
})

const { name, description, active } = useFormBindings(formData)
</script>
```

## Example: With extra props (e.g. validation)

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
