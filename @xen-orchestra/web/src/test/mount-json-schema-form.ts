import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import { useJsonSchemaForm } from '@/modules/plugin/json-schema-form/use-json-schema-form.composable.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'
import { defineComponent, type Ref, ref, type VNode } from 'vue'
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
