# `useFormValidation` composable

Wraps [Regle](https://reglejs.dev) to provide a simple, unified interface for form validation with two severity levels: **errors** (blocking) and **warnings** (advisory). Consumers never need to import from `@regle/core` or `@regle/rules` — everything is re-exported from this package.

## Usage

```ts
import { isFilled, integer, type Maybe, required, useFormValidation, withMessage } from '@core/packages/form-validation'

const { errors, warnings, validate, handleBlur, reset, useFieldMetadata } = useFormValidation(formData, {
  errors: {
    // onBlur → shown when the user leaves the field
    onBlur: () => ({
      port: { integer },
    }),
    // onSubmit → shown only when validate() is called
    onSubmit: () => ({
      name: { required: withMessage(required, t('name-required')) },
    }),
  },
  warnings: {
    onBlur: () => ({
      port: {
        outOfRange: withMessage(
          (value: Maybe<number>) => !isFilled(value) || (value >= 1 && value <= 65535),
          t('port-out-of-range')
        ),
      },
    }),
  },
})
```

## Parameters

|          | Required | Type        | Description                   |
| -------- | :------: | ----------- | ----------------------------- |
| `data`   |    ✓     | `TData`     | The reactive form data object |
| `config` |    ✓     | (see below) | Validation configuration      |

### `config` object

|            | Required | Type                             | Description                   |
| ---------- | :------: | -------------------------------- | ----------------------------- |
| `errors`   |          | `FormValidationRuleGroup<TData>` | Rules for blocking validation |
| `warnings` |          | `FormValidationRuleGroup<TData>` | Rules for advisory validation |

### `FormValidationRuleGroup<TData>`

Rules are split into two groups that control when they become visible:

| Key        | Description                                                       |
| ---------- | ----------------------------------------------------------------- |
| `onBlur`   | Rules shown when the user leaves a field (`handleBlur` is called) |
| `onSubmit` | Rules shown only when `validate()` is called                      |

Both groups are optional. A single field can have different rules in each group — for example, `required` in `onSubmit` (avoid surfacing the error while the user is still navigating) and a range check in `onBlur` (immediate feedback when leaving the field).

Each group accepts either a plain rule tree object or a getter function — use a getter to keep translated messages reactive across locale changes:

```ts
errors: {
  onSubmit: () => ({
    name: { required: withMessage(required, t('name-required')) },
  }),
}
```

## Return value

|                    | Type                                                   | Description                                                                                                       |
| ------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `errors`           | `ComputedRef<FormFieldMessages<TData>>`                | Per-field blocking message strings. A field is populated only after it is touched or `validate()` is called.      |
| `warnings`         | `ComputedRef<FormFieldMessages<TData>>`                | Per-field advisory message strings. A field is populated after `handleBlur(field)` or `validate()` is called.     |
| `validate`         | `() => Promise<boolean>`                               | Touches all warning fields, validates all error rules, and returns `true` when the form is valid. Call on submit. |
| `reset`            | `() => void`                                           | Resets dirty flags and clears all messages for both errors and warnings.                                          |
| `handleBlur`       | `(field: keyof TData) => void`                         | Marks a field dirty in the `onBlur` rule groups. Call on field blur.                                              |
| `useFieldMetadata` | `(field, extras?) => () => FormFieldMetadata & extras` | Returns a metadata factory ready to pass to `useField`. Bundles error, warning, and the blur handler.             |

`FormFieldMessages<TData>` is `{ [K in keyof TData]: string | undefined }` — all fields are always present; the value is `undefined` when there is no active message.
Wrapping them into UI-layer message objects (with an accent, array form, etc.) is the consumer's responsibility.
Since `InputWrapperMessage` accepts a plain `string`, the field values can be passed directly to `:error` / `:warning` props with no conversion needed.

## Severity levels

| Level   | Gates submit | When shown                                                 |
| ------- | :----------: | ---------------------------------------------------------- |
| Error   |      ✓       | After the field is touched or `validate()` is called       |
| Warning |              | After `handleBlur(field)` (blur) or `validate()` is called |

## Example: complete form composable

```ts
import { useFormValidation, required, integer, withMessage } from '@core/packages/form-validation'
import { useFormBindings } from '@core/packages/form-bindings'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

type MyFormData = {
  name: string
  port: number | undefined
}

export function useMyForm() {
  const { t } = useI18n()

  const formData = reactive<MyFormData>({
    name: '',
    port: undefined,
  })

  const { validate, reset, useFieldMetadata } = useFormValidation(formData, {
    errors: {
      // Show 'required' only on submit — don't nag the user before they've had a chance to fill in the form.
      onSubmit: () => ({
        name: { required: withMessage(required, t('name-required')) },
        port: { required: withMessage(required, t('port-required')) },
      }),
      // Show format errors as soon as the user leaves the field.
      onBlur: () => ({
        port: { integer },
      }),
    },
    warnings: {
      onBlur: () => ({
        port: {
          outOfRange: withMessage(
            (value: Maybe<number>) => !isFilled(value) || (value >= 1 && value <= 65535),
            t('port-out-of-range')
          ),
        },
      }),
    },
  })

  const { useField } = useFormBindings(formData)

  // All field props (v-model, error, warning, blur handler) bundled in a single binding
  const nameField = useField('name', useFieldMetadata('name'))
  const portField = useField(
    'port',
    useFieldMetadata('port', () => ({ label: t('port') }))
  )

  async function validateAndBuildPayload() {
    const valid = await validate()
    if (!valid) {
      return
    }

    // formData is validated — safe to submit
  }

  return { formData, nameField, portField, validateAndBuildPayload, reset }
}
```

Template:

```vue
<template>
  <!-- No separate @blur needed — onBlur is part of the binding -->
  <VtsInput v-bind="nameField" />
  <VtsInput v-bind="portField" />
</template>
```

## Available rules

All rules from `@regle/rules` are re-exported from this package. Commonly used rules:

| Rule          | Description                              |
| ------------- | ---------------------------------------- |
| `required`    | Value must be filled                     |
| `integer`     | Value must be an integer                 |
| `minValue`    | Value must be ≥ a minimum                |
| `maxValue`    | Value must be ≤ a maximum                |
| `minLength`   | String/array length must be ≥ a minimum  |
| `maxLength`   | String/array length must be ≤ a maximum  |
| `email`       | Value must be a valid email address      |
| `url`         | Value must be a valid URL                |
| `requiredIf`  | Value is required when a condition holds |
| `withMessage` | Attaches a custom message to any rule    |
| `isFilled`    | Type guard: checks if a value is defined |

`type Maybe<T>` is also re-exported for use in custom validator signatures.
