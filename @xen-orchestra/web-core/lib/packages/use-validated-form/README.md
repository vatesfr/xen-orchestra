# `use-validated-form` package

Provides two composables for building validated forms: `useValidatedForm` for single-step forms and `useMultiStepValidatedForm` for wizard-style multi-step forms.

---

## `useValidatedForm` composable

Combines `useFormBindings` and `useFormValidation` into a single composable so each field key appears exactly once — no more passing the same key to both a binding and a metadata helper.

### Usage

```typescript
import { useValidatedForm } from '@core/packages/use-validated-form'

const { useField, useFormSelect, useSelect, validate, reset, handleBlur } = useValidatedForm(formData, {
  errors: {
    onSubmit: () => ({
      title: { required: requiredRule() },
    }),
  },
  warnings: {
    onBlur: () => ({
      quantity: { outOfRange: outOfRangeRule(1, 999) },
    }),
  },
})
```

### Parameters

|          | Required | Type                          | Description                                                               |
| -------- | :------: | ----------------------------- | ------------------------------------------------------------------------- |
| `data`   |    ✓     | `TData`                       | A reactive object holding the form field values                           |
| `config` |    ✓     | `FormValidationConfig<TData>` | Validation rule configuration — same shape as `useFormValidation` accepts |

`FormValidationConfig` is documented in detail in `@core/packages/form-validation`.

### Return value

#### Binding factories

| Property        | Signature                                                         | Description                                                                            |
| --------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `useField`      | `(key, extras?) => ComputedRef<ModelBinding & FieldMetadata & E>` | Creates a combined v-model + validation binding for a text/number/checkbox input       |
| `useFormSelect` | `(key, sources, config?) => UseFormSelectReturn`                  | Registers a select, auto-wires `model`, and records the key→id mapping in the registry |
| `useSelect`     | see overloads below                                               | Creates a binding for a `VtsSelect`-like component                                     |

##### `useField(key, extras?)`

Returns a `ComputedRef` merging:

- `modelValue` / `onUpdate:modelValue` — the v-model pair for the field
- `error`, `warning`, `onBlur` — from `FieldMetadata`
- Any additional props returned by the optional `extras` factory (e.g. `label`, `required`, `info`)

##### `useFormSelect(key, sources, config?)`

A wrapper around `useFormSelect` from `@core/packages/form-select` that:

1. Automatically sets `model: toRef(data, key)` — no need to pass it manually
2. Records the `id → key` mapping so `useSelect(id)` can resolve validation metadata without an explicit key

`config` accepts all `useFormSelect` options **except** `model` (which is injected).

##### `useSelect` overloads

| Overload                      | When to use                                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `useSelect(id, extras?)`      | Select was registered with `useFormSelect` in the same `useValidatedForm` call — key is resolved from the registry     |
| `useSelect(id, key, extras?)` | Select was created externally (e.g. inside a nested composable) — key cannot be inferred and must be passed explicitly |

Both overloads return a `ComputedRef` merging `{ id }`, `FieldMetadata`, and any extras.

#### Delegated from `useFormValidation`

| Property     | Type                           | Description                                                                      |
| ------------ | ------------------------------ | -------------------------------------------------------------------------------- |
| `validate`   | `() => Promise<boolean>`       | Validates all error rules and touches warning fields. Returns `true` when valid  |
| `reset`      | `() => void`                   | Resets all dirty flags and clears all messages                                   |
| `handleBlur` | `(field: keyof TData) => void` | Marks a field dirty in the `onBlur` rule groups (called automatically by fields) |

### Example: form with text inputs and a managed select

```typescript
import { useValidatedForm } from '@core/packages/use-validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

type ProductFormData = {
  category: string | undefined
  title: string
}

export function useProductForm() {
  const { t } = useI18n()

  const formData = reactive<ProductFormData>({ category: undefined, title: '' })

  const { useField, useFormSelect, useSelect, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        category: { required },
        title: { required },
      }),
    },
  })

  // model is wired automatically; id→key mapping is recorded in the registry
  const { id: categorySelectId } = useFormSelect('category', categories, {
    searchable: true,
    required: true,
    option: { label: 'name', value: 'id' },
  })

  // key is inferred from the registry — no need to repeat 'category'
  const categorySelectBindings = useSelect(categorySelectId, () => ({ label: t('category') }))
  const titleInputBindings = useField('title', () => ({ label: t('title'), required: true }))

  return { categorySelectBindings, titleInputBindings, validate }
}
```

### Example: select created by an external composable (explicit key)

When `useFormSelect` is called inside a nested composable (outside the current `useValidatedForm` scope), the id→key mapping cannot be inferred automatically. Pass the key as the second argument to `useSelect`:

```typescript
const { useField, useSelect, validate } = useValidatedForm(formData, {
  errors: {
    onSubmit: () => ({
      author: { required },
      quantity: { required },
    }),
  },
})

// authorSelectId comes from a composable that called useFormSelect internally
const { authorSelectId } = useAuthorSelect(toRef(formData, 'author'))

// key 'author' must be provided explicitly because it was registered outside this scope
const authorSelectBindings = useSelect(authorSelectId, 'author', () => ({ label: t('author') }))
const quantityInputBindings = useField('quantity', () => ({ label: t('quantity'), required: true }))
```

---

## `defineFormSteps`

Helper that creates a typed reactive object for multi-step forms. It is the recommended way to declare form data for `useMultiStepValidatedForm` — TypeScript infers the full nested shape so no separate type declaration is needed.

```typescript
import { defineFormSteps } from '@core/packages/use-validated-form'

const formData = defineFormSteps({
  general: { category: undefined as string | undefined, title: '' },
  details: { region: undefined as string | undefined, quantity: undefined as number | undefined },
})
```

Top-level keys become step names. Values are plain objects whose keys become field names. The returned object is reactive (equivalent to wrapping with `reactive()`).

---

## `useMultiStepValidatedForm` composable

Single entry point for wizard-style forms. The form data is declared as a nested reactive object where each top-level key is a step name — the structure itself encodes step membership, so no fields array is needed and no step prefix is required when creating bindings.

TypeScript infers step names from the data and config keys, giving full autocompletion on `currentStep`, `validateStep('stepName')`, and `isStepValid('stepName')`.

### Usage

```typescript
import { defineFormSteps, useMultiStepValidatedForm } from '@core/packages/use-validated-form'

const formData = defineFormSteps({
  general: { category: undefined as string | undefined, title: '' },
  details: { region: undefined as string | undefined, quantity: undefined as number | undefined },
})

const { useField, currentStep, next, back, isStepValid, areAllStepsValid, validateAllSteps } =
  useMultiStepValidatedForm(formData, {
    general: {
      errors: { onSubmit: () => ({ category: { required }, title: { required } }) },
    },
    details: {
      errors: {
        onSubmit: () => ({ region: { required }, quantity: { required } }),
        onBlur: () => ({ quantity: { outOfRange: outOfRangeRule(1, 999) } }),
      },
    },
  })
```

### Parameters

|               | Required | Type                                                     | Description                                                                     |
| ------------- | :------: | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `data`        |    ✓     | `TData`                                                  | A nested reactive object — top-level keys are step names, values are field maps |
| `stepConfigs` |    ✓     | `{ [K in keyof TData]: FormValidationConfig<TData[K]> }` | Validation config for each step, typed to that step's fields only               |

Each step config is a `FormValidationConfig` scoped to its own sub-object: writing a field key from another step inside a step's rules is a TypeScript error.

### Return value

#### Binding factories

| Property        | Signature                                                         | Description                                                                                      |
| --------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `useField`      | `(key, extras?) => ComputedRef<ModelBinding & FieldMetadata & E>` | Same as `useValidatedForm`'s `useField` — step routing is automatic from the data structure      |
| `useFormSelect` | `(key, sources, config?) => UseFormSelectReturn`                  | Same as `useValidatedForm`'s `useFormSelect` — step routing is automatic                         |
| `useSelect`     | see overloads in `useValidatedForm`                               | Same overloads as `useValidatedForm`'s `useSelect` — resolves step from registry or explicit key |

`key` for `useField` and `useFormSelect` accepts any field name from any step's sub-object. The composable resolves which step's validation instance to use based on where the field is declared in `data`.

#### Navigation

| Property      | Type                                 | Description                                                                                                           |
| ------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `currentStep` | `ComputedRef<keyof TSteps & string>` | The currently active step name                                                                                        |
| `next`        | `() => Promise<boolean>`             | Validates the current step; advances to the next step only if validation passes. Returns `true` if the step was valid |
| `back`        | `() => void`                         | Goes to the previous step without validation                                                                          |

#### Validation state

| Property           | Type                                           | Description                                                                               |
| ------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `areAllStepsValid` | `ComputedRef<boolean>`                         | `true` only when every step has been validated and all pass                               |
| `isStepValid`      | `(step: keyof TSteps) => boolean \| undefined` | Last known validation result for a step; `undefined` if the step has never been validated |
| `isValidating`     | `Ref<boolean>`                                 | `true` while `validateAllSteps()` is in flight; guards against concurrent calls           |
| `validateStep`     | `(step: keyof TSteps) => Promise<boolean>`     | Validates a single step by name and stores the result                                     |
| `validateAllSteps` | `() => Promise<boolean>`                       | Validates all steps concurrently. Returns `true` only if every step passes                |

`validateAllSteps` is a no-op (returns `false`) when `isValidating` is already `true`.

### Example: wizard form with navigation and per-step validation

```typescript
import { defineFormSteps, useMultiStepValidatedForm } from '@core/packages/use-validated-form'
import { useI18n } from 'vue-i18n'

export function useCreateItemWizard() {
  const { t } = useI18n()

  const formData = defineFormSteps({
    general: {
      category: undefined as string | undefined,
      title: '',
      summary: '',
      featured: false,
    },
    details: {
      region: undefined as string | undefined,
      quantity: undefined as number | undefined,
    },
  })

  const {
    useField,
    useFormSelect,
    useSelect,
    currentStep,
    next,
    back,
    isStepValid,
    areAllStepsValid,
    validateAllSteps,
  } = useMultiStepValidatedForm(formData, {
    general: {
      errors: {
        onSubmit: () => ({
          category: { required: requiredRule() },
          title: { required: requiredRule() },
        }),
      },
    },
    details: {
      errors: {
        onSubmit: () => ({
          region: { required: requiredRule() },
          quantity: { required: requiredRule() },
        }),
        onBlur: () => ({ quantity: { outOfRange: outOfRangeRule(1, 999) } }),
      },
    },
  })

  // Bindings — no step prefix needed, routing is automatic
  const { id: categorySelectId } = useFormSelect('category', categories, {
    searchable: true,
    option: { label: 'name', value: 'id' },
  })
  const categorySelectBindings = useSelect(categorySelectId, () => ({ label: t('category') }))
  const titleInputBindings = useField('title', () => ({ label: t('title'), required: true }))
  const summaryInputBindings = useField('summary', () => ({ label: t('summary') }))
  const featuredCheckboxBindings = useField('featured')

  const { id: regionSelectId } = useFormSelect('region', regions, {
    searchable: true,
    option: { label: 'name', value: 'id' },
  })
  const regionSelectBindings = useSelect(regionSelectId, () => ({ label: t('region') }))
  const quantityInputBindings = useField('quantity', () => ({ label: t('quantity'), required: true }))

  async function onSubmit() {
    const isValid = await validateAllSteps()

    if (!isValid) {
      return
    }

    return {
      categoryId: formData.general.category!,
      title: formData.general.title,
      ...(formData.general.summary !== '' && { summary: formData.general.summary }),
      ...(formData.general.featured && { featured: true }),
      region: formData.details.region!,
      quantity: formData.details.quantity!,
    }
  }

  return {
    formData,
    currentStep,
    next,
    back,
    isStepValid,
    areAllStepsValid,
    categorySelectBindings,
    titleInputBindings,
    summaryInputBindings,
    featuredCheckboxBindings,
    regionSelectBindings,
    quantityInputBindings,
    onSubmit,
  }
}
```

```vue
<script lang="ts" setup>
const {
  currentStep,
  next,
  back,
  areAllStepsValid,
  categorySelectBindings,
  titleInputBindings,
  summaryInputBindings,
  featuredCheckboxBindings,
  regionSelectBindings,
  quantityInputBindings,
  onSubmit,
} = useCreateItemWizard()
</script>

<template>
  <div v-if="currentStep === 'general'">
    <VtsSelect v-bind="categorySelectBindings" />
    <VtsInput v-bind="titleInputBindings" />
    <VtsInput v-bind="summaryInputBindings" />
    <VtsCheckbox v-bind="featuredCheckboxBindings" />
  </div>
  <div v-else-if="currentStep === 'details'">
    <VtsSelect v-bind="regionSelectBindings" />
    <VtsInput v-bind="quantityInputBindings" />
  </div>

  <button :disabled="currentStep === 'general'" @click="back">Back</button>
  <button v-if="currentStep !== 'details'" @click="next">Next</button>
  <button v-else :disabled="!areAllStepsValid" @click="onSubmit">Submit</button>
</template>
```
