import { getSchemaDefaults } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import { useJsonSchemaForm } from '@/modules/plugin/json-schema-form/use-json-schema-form.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export function useXoPluginTestForm(rawPlugin: MaybeRefOrGetter<FrontXoPlugin>) {
  const plugin = toComputed(rawPlugin)

  const testSchema = computed(() => plugin.value.testSchema)

  // xo-server rejects a test without data when the plugin has a test schema
  function getInitialTestData() {
    return testSchema.value === undefined ? undefined : (getSchemaDefaults(testSchema.value) ?? {})
  }

  const testData = ref<unknown>(getInitialTestData())

  const { summaryErrors, submit } = useJsonSchemaForm(testSchema, testData)

  return { testSchema, testData, summaryErrors, submit }
}
