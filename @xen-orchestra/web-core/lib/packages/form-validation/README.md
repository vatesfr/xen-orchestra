# `useFormValidation` composable

Wraps [Regle](https://reglejs.dev) to provide a simple, unified interface for form validation with two severity levels: **errors** (blocking) and **warnings** (advisory). Consumers never need to import from `@regle/core` or `@regle/rules` — everything is re-exported from this package.

## Usage

```ts
import { isFilled, integer, type Maybe, required, useFormValidation, withMessage } from '@core/packages/form-validation'

const { errors, warnings, validate, touch, reset } = useFormValidation(formData, {
  errors: () => ({
    name: { required: withMessage(required, t('name-required')) },
    port: { integer },
  }),
  warnings: () => ({
    port: {
      outOfRange: withMessage(
        (value: Maybe<number>) => !isFilled(value) || (value >= 1 && value <= 65535),
        t('port-out-of-range')
      ),
    },
  }),
})
```

## Parameters

|          | Required | Type        | Description                   |
| -------- | :------: | ----------- | ----------------------------- |
| `data`   |    ✓     | `TData`     | The reactive form data object |
| `config` |    ✓     | (see below) | Validation configuration      |

### `config` object

|            | Required | Type                                                                 | Description                                                                                                   |
| ---------- | :------: | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `errors`   |    ✓     | `ReglePartialRuleTree<TData>` or `() => ReglePartialRuleTree<TData>` | Rules for blocking validation. Use a getter function to keep error messages reactive to locale changes.       |
| `warnings` |          | `ReglePartialRuleTree<TData>` or `() => ReglePartialRuleTree<TData>` | Rules for non-blocking validation. Warning messages are shown after `touch(field)` or `validate()` is called. |

## Return value

|            | Type                                    | Description                                                                                                       |
| ---------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `errors`   | `ComputedRef<FormFieldMessages<TData>>` | Per-field blocking message strings. A field is populated only after it is touched or `validate()` is called.      |
| `warnings` | `ComputedRef<FormFieldMessages<TData>>` | Per-field advisory message strings. A field is populated after `touch(field)` or `validate()` is called.          |
| `validate` | `() => Promise<boolean>`                | Touches all warning fields, validates all error rules, and returns `true` when the form is valid. Call on submit. |
| `reset`    | `() => void`                            | Resets dirty flags and clears all messages for both errors and warnings.                                          |
| `touch`    | `(field: keyof TData) => void`          | Marks a single field dirty in the warning instance so its warning message becomes visible. Call on field blur.    |

`FormFieldMessages<TData>` is `{ [K in keyof TData]?: string }` — raw message strings, one per field.
Wrapping them into UI-layer message objects (with an accent, array form, etc.) is the consumer's responsibility.
Since `InputWrapperMessage` accepts a plain `string`, the field values can be passed directly to `:error` / `:warning` props with no conversion needed.

## Severity levels

| Level   | Gates submit | When shown                                            |
| ------- | :----------: | ----------------------------------------------------- |
| Error   |      ✓       | After the field is touched or `validate()` is called  |
| Warning |              | After `touch(field)` (blur) or `validate()` is called |

## Example: complete form composable

```ts
import { useFormValidation, required, integer, withMessage } from '@core/packages/form-validation'
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

  const { errors, warnings, validate, touch, reset } = useFormValidation(formData, {
    // Use a getter so error messages stay in sync with the active locale.
    errors: () => ({
      name: { required: withMessage(required, t('name-required')) },
      port: { required: withMessage(required, t('port-required')), integer },
    }),
    warnings: () => ({
      port: {
        outOfRange: withMessage(
          (value: Maybe<number>) => !isFilled(value) || (value >= 1 && value <= 65535),
          t('port-out-of-range')
        ),
      },
    }),
  })

  async function validateAndBuildPayload() {
    const valid = await validate()
    if (!valid) {
      return
    }

    // formData is validated — safe to submit
  }

  return { formData, errors, warnings, validateAndBuildPayload, touch, reset }
}
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
