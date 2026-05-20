# `useFormValidation` composable

Wraps [Regle](https://reglejs.dev) to provide a simple, unified interface for form validation with two severity levels: **errors** (blocking) and **warnings** (advisory). Consumers never need to import from `@regle/core` or `@regle/rules` — everything is re-exported from this package.

## Usage

```ts
import { integer, outOfRange, required, useFormValidation, withMessage } from '@core/packages/form-validation'

const { errors, warnings, validate, handleBlur, reset, useFieldMetadata } = useFormValidation(formData, {
  errors: {
    // onBlur → shown when the user leaves the field
    onBlur: () => ({
      age: { integer },
    }),
    // onSubmit → shown only when validate() is called
    onSubmit: () => ({
      label: { required: withMessage(required, t('label-required')) },
    }),
  },
  warnings: {
    onBlur: () => ({
      age: { outOfRange: outOfRange(0, 150) },
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
    label: { required: withMessage(required, t('label-required')) },
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

To wire these into `VtsInputWrapper`-based components, each string must be converted to `{ content, accent: 'danger' }` for errors and `{ content, accent: 'warning' }` for warnings — a plain string defaults to the `'info'` accent. `useValidatedForm` (from `@core/packages/validated-form`) performs this conversion automatically and is the recommended way to integrate validation with form fields.

## Severity levels

| Level   | Gates submit | When shown                                                 |
| ------- | :----------: | ---------------------------------------------------------- |
| Error   |      ✓       | After the field is touched or `validate()` is called       |
| Warning |              | After `handleBlur(field)` (blur) or `validate()` is called |

## Example: complete form composable

```ts
import { useFormValidation, required, integer, outOfRange, withMessage } from '@core/packages/form-validation'
import { useFormBindings } from '@core/packages/form-bindings'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

type MyFormData = {
  label: string
  age: number | undefined
}

export function useMyForm() {
  const { t } = useI18n()

  const formData = reactive<MyFormData>({
    label: '',
    age: undefined,
  })

  const { validate, reset, useFieldMetadata } = useFormValidation(formData, {
    errors: {
      // Show 'required' only on submit — don't nag the user before they've had a chance to fill in the form.
      onSubmit: () => ({
        label: { required: withMessage(required, t('label-required')) },
        age: { required: withMessage(required, t('age-required')) },
      }),
      // Show format errors as soon as the user leaves the field.
      onBlur: () => ({
        age: { integer },
      }),
    },
    warnings: {
      onBlur: () => ({
        age: { outOfRange: outOfRange(0, 150) },
      }),
    },
  })

  const { useField } = useFormBindings(formData)

  const labelField = useField('label', useFieldMetadata('label'))
  const ageField = useField(
    'age',
    useFieldMetadata('age', () => ({ label: t('age') }))
  )

  async function validateAndBuildPayload() {
    const valid = await validate()

    if (!valid) {
      return
    }
  }

  return { formData, labelField, ageField, validateAndBuildPayload, reset }
}
```

## Merging configs — base / augmented form pattern

`mergeValidationConfigs` combines two `FormValidationConfig` objects into one. It is useful when a reusable **base form composable** defines common validation rules and a derived **augmented form** composable adds extra fields and rules on top.

```ts
mergeValidationConfigs(base, extra?)
```

| Parameter | Required | Type                           | Description                              |
| --------- | :------: | ------------------------------ | ---------------------------------------- |
| `base`    |    ✓     | `FormValidationConfig<TBase>`  | The base config to extend                |
| `extra`   |          | `FormValidationConfig<TExtra>` | Additional rules to layer on top of base |

- `errors` and `warnings` groups are merged independently.
- Within each group, `onBlur` and `onSubmit` rule trees are merged by spreading `extra` over `base` — extra fields win on key collision.
- Both plain objects and getter functions are supported; if either side is a getter the result is a getter.
- When `extra` is omitted, `base` is returned as-is.

### Example

```ts
// use-base-form.ts — base composable shared by several form variants
import {
  mergeValidationConfigs,
  useFormValidation,
  required,
  withMessage,
  type FormValidationConfig,
} from '@core/packages/form-validation'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

type BaseFormData = { label: string; description: string }

export function useBaseForm(extraConfig?: FormValidationConfig<BaseFormData>) {
  const { t } = useI18n()
  const formData = reactive<BaseFormData>({ label: '', description: '' })

  const baseConfig: FormValidationConfig<BaseFormData> = {
    errors: {
      onSubmit: () => ({
        label: { required: withMessage(required, t('error:label-required')) },
      }),
    },
  }

  const { validate, reset, useFieldMetadata } = useFormValidation(
    formData,
    mergeValidationConfigs(baseConfig, extraConfig)
  )

  // …
  return { formData, validate, reset, useFieldMetadata }
}
```

```ts
// use-extended-form.ts — augmented form that adds extra validation on top
import { minLength, type FormValidationConfig } from '@core/packages/form-validation'
import { useBaseForm } from './use-base-form'

type BaseFormData = { label: string; description: string }

export function useExtendedForm() {
  const extras: FormValidationConfig<BaseFormData> = {
    errors: {
      onBlur: () => ({
        label: { minLength: minLength(3) },
      }),
    },
  }

  return useBaseForm(extras)
}
```

## Available rules

All rules from `@regle/rules` are re-exported from this package. Commonly used rules:

| Rule          | Description                                                |
| ------------- | ---------------------------------------------------------- |
| `required`    | Value must be filled                                       |
| `integer`     | Value must be an integer                                   |
| `minValue`    | Value must be ≥ a minimum                                  |
| `maxValue`    | Value must be ≤ a maximum                                  |
| `minLength`   | String/array length must be ≥ a minimum                    |
| `maxLength`   | String/array length must be ≤ a maximum                    |
| `email`       | Value must be a valid email address                        |
| `url`         | Value must be a valid URL                                  |
| `requiredIf`  | Value is required when a condition holds                   |
| `withMessage` | Attaches a custom message to any rule                      |
| `isFilled`    | Type guard: checks if a value is defined                   |
| `outOfRange`  | Number must be between `min` and `max` (passes when empty) |

`type Maybe<T>` and `type FormRuleDeclaration<T>` are also re-exported for use in custom validator signatures.

## Global configuration

`defineFormValidationConfig` (re-exported from `@regle/core` as `defineRegleOptions`) lets you override the default message of any rule for the entire application. Install the result via the `RegleVuePlugin`:

```ts
// src/plugins/form-validation.config.ts
import { defineFormValidationConfig, integer, outOfRange, required, withMessage } from '@core/packages/form-validation'
import { useI18n } from 'vue-i18n'

export const formValidationConfig = defineFormValidationConfig({
  rules: () => {
    const { t } = useI18n()

    return {
      required: withMessage(required, () => t('form:error:required')),
      integer: withMessage(integer, () => t('form:error:integer')),
      outOfRange: withMessage(outOfRange, ({ $params: [min, max] }) => t('form:warning:out-of-range', { min, max })),
    }
  },
})
```

```ts
// src/main.ts
import { formValidationConfig } from '@/plugins/form-validation.config.ts'
import { RegleVuePlugin } from '@regle/core'

app.use(RegleVuePlugin, formValidationConfig)
```

Once installed, `required`, `integer`, and `outOfRange` show the translated messages automatically — no `withMessage` call is needed at each call site.
