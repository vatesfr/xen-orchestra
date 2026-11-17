import { useJsonSchemaForm } from '@/modules/plugin/form/use-json-schema-form.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import { defineComponent, h, type Ref, ref, type VNode } from 'vue'
import { useI18n } from 'vue-i18n'

// The form provides its context to the fields rendered under it
export function mountJsonSchemaForm(
  schema: JsonSchema | undefined,
  initialValue: unknown,
  render: (value: Ref<unknown>) => VNode
) {
  const value = ref(initialValue)

  const wrapper = mount(
    defineComponent({
      setup: () => ({ ...useJsonSchemaForm(schema, value), t: useI18n().t }),
      render: () => render(value),
    }),
    { global: createGlobalTestConfig() }
  )

  return { wrapper, value }
}

// A component does not inject what it provides itself, so the composable runs in a field rendered under the form
export function mountInJsonSchemaForm<TResult>(
  schema: JsonSchema | undefined,
  initialValue: unknown,
  composable: () => TResult
) {
  // wrapped, as the composable may return `undefined`
  let result: { value: TResult } | undefined

  const Field = defineComponent({
    setup() {
      result = { value: composable() }

      return () => null
    },
  })

  const { wrapper, value } = mountJsonSchemaForm(schema, initialValue, () => h(Field))

  if (result === undefined) {
    throw new Error('the composable did not run in the form')
  }

  return { wrapper, value, result: result.value }
}
