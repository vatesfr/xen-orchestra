import { useJsonSchemaForm } from '@/modules/plugin/form/use-json-schema-form.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import { mountComposableUnderSetup, mountWithSetupResult } from '@/test/mount-with-setup.ts'
import { type Ref, ref, type VNode } from 'vue'

// The form value, and the setup of a form editing it
function createJsonSchemaFormSetup(schema: JsonSchema | undefined, initialValue: unknown) {
  const value = ref(initialValue)

  return { value, setupForm: () => useJsonSchemaForm(schema, value) }
}

// The form provides its context to the fields rendered under it
export function mountJsonSchemaForm(
  schema: JsonSchema | undefined,
  initialValue: unknown,
  render: (value: Ref<unknown>) => VNode
) {
  const { value, setupForm } = createJsonSchemaFormSetup(schema, initialValue)

  const { wrapper, result: form } = mountWithSetupResult(() => ({ result: setupForm(), render: () => render(value) }))

  return { wrapper, form }
}

// The composable runs in a field rendered under the form
export function mountInJsonSchemaForm<TResult>(
  schema: JsonSchema | undefined,
  initialValue: unknown,
  composable: () => TResult
) {
  const { value, setupForm } = createJsonSchemaFormSetup(schema, initialValue)

  const { provided: form, result } = mountComposableUnderSetup(setupForm, composable)

  return { form, value, result }
}
