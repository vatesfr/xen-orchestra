# `useValidatedForm` composable

Combines `useFormBindings` and `useFormValidation` into a single composable so each field key appears exactly once — no more passing the same key to both a binding and a metadata helper.

## Usage

```typescript
import { useValidatedForm } from '@core/packages/use-validated-form'

const { useField, useFormSelect, useSelect, validate, reset, errors, warnings, handleBlur } = useValidatedForm(
  formData,
  {
    errors: {
      onSubmit: () => ({
        name: { required: requiredRule() },
      }),
    },
    warnings: {
      onBlur: () => ({
        port: { outOfRange: outOfRangeRule(1, 65535) },
      }),
    },
  }
)
```

## Parameters

|          | Required | Type                              | Description                                                                         |
| -------- | :------: | --------------------------------- | ----------------------------------------------------------------------------------- |
| `data`   |    ✓     | `TData`                           | A reactive object holding the form field values                                     |
| `config` |    ✓     | `FormValidationConfig<TData>`     | Validation rule configuration — same shape as `useFormValidation` accepts           |

`FormValidationConfig` is documented in detail in `@core/packages/form-validation`.

## Return value

### Binding factories

| Property        | Signature                                                      | Description                                                                             |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `useField`      | `(key, extras?) => ComputedRef<ModelBinding & FormFieldMetadata & extras>` | Creates a combined v-model + validation binding for a text/number/checkbox input        |
| `useFormSelect` | `(key, sources, config?) => UseFormSelectReturn`               | Registers a select, auto-wires `model`, and records the key→id mapping in the registry |
| `useSelect`     | see overloads below                                            | Creates a binding for a `VtsSelect`-like component                                     |

#### `useField(key, extras?)`

Returns a `ComputedRef` merging:
- `modelValue` / `onUpdate:modelValue` — the v-model pair for the field
- `error`, `warning`, `onBlur` — from `FormFieldMetadata`
- Any additional props returned by the optional `extras` factory (e.g. `label`, `required`, `info`)

#### `useFormSelect(key, sources, config?)`

A wrapper around `useFormSelect` from `@core/packages/form-select` that:
1. Automatically sets `model: toRef(data, key)` — no need to pass it manually
2. Records the `id → key` mapping so `useSelect(id)` can resolve validation metadata without an explicit key

`config` accepts all `useFormSelect` options **except** `model` (which is injected).

#### `useSelect` overloads

| Overload | When to use |
| -------- | ----------- |
| `useSelect(id, extras?)` | Select was registered with `useFormSelect` in the same `useValidatedForm` call — key is resolved from the registry |
| `useSelect(id, key, extras?)` | Select was created externally (e.g. inside a nested composable) — key cannot be inferred and must be passed explicitly |

Both overloads return a `ComputedRef` merging `{ id }`, `FormFieldMetadata`, and any extras.

### Delegated from `useFormValidation`

| Property      | Type                                    | Description                                                                    |
| ------------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| `validate`    | `() => Promise<boolean>`                | Validates all error rules and touches warning fields. Returns `true` when valid |
| `reset`       | `() => void`                            | Resets all dirty flags and clears all messages                                  |
| `errors`      | `ComputedRef<FormFieldMessages<TData>>` | Per-field blocking message strings                                              |
| `warnings`    | `ComputedRef<FormFieldMessages<TData>>` | Per-field advisory message strings                                              |
| `handleBlur`  | `(field: keyof TData) => void`          | Marks a field dirty in the `onBlur` rule groups                                 |

## Example: form with text inputs and a managed select

```typescript
import { useValidatedForm } from '@core/packages/use-validated-form'
import { required } from '@core/packages/form-validation'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

type MyFormData = {
  pool: string | undefined
  name: string
}

export function useMyForm() {
  const { t } = useI18n()

  const formData = reactive<MyFormData>({ pool: undefined, name: '' })

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        pool: { required },
        name: { required },
      }),
    },
  })

  // model is wired automatically; id→key mapping is recorded in the registry
  const { id: poolSelectId } = useFormSelect('pool', pools, {
    searchable: true,
    required: true,
    option: { label: 'name_label', value: 'id' },
  })

  // key is inferred from the registry — no need to repeat 'pool'
  const poolSelectBindings = useSelect(poolSelectId, () => ({ label: t('pool') }))
  const nameInputBindings = useField('name', () => ({ label: t('name'), required: true }))

  return { poolSelectBindings, nameInputBindings, validate }
}
```

## Example: select created by an external composable (explicit key)

When a `useFormSelect` is called inside a nested composable (outside the current `useValidatedForm` scope), the id→key mapping cannot be inferred automatically. Pass the key as the second argument to `useSelect`:

```typescript
const { useField, useSelect, validate } = useValidatedForm(formData, {
  errors: {
    onSubmit: () => ({
      pif: { required },
      vlan: { required },
    }),
  },
})

// interfacesSelectId comes from a composable that called useFormSelect internally
const { interfacesSelectId } = useNetworkPifSelect(selectedPool, toRef(formData, 'pif'), { value: 'id' })

// key 'pif' must be provided explicitly because it was registered outside this scope
const interfaceSelectBindings = useSelect(interfacesSelectId, 'pif', () => ({ label: t('interface') }))
const vlanInputBindings = useField('vlan', () => ({ label: t('vlan'), required: true }))
```
