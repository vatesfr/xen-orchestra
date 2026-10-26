import { useXoPluginTestJob } from '@/modules/plugin/jobs/xo-plugin-test.job.ts'
import { getSchemaDefaults } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import { useJsonSchemaForm } from '@/modules/plugin/json-schema-form/use-json-schema-form.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { useActionError } from '@/shared/composables/action-error.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export function useXoPluginTest(rawPlugin: MaybeRefOrGetter<FrontXoPlugin>) {
  const plugin = toComputed(rawPlugin)

  const { error, runAction } = useActionError()

  const testSchema = computed(() => plugin.value.testSchema)

  // xo-server rejects a test without data when the plugin has a test schema
  function getInitialTestData() {
    return testSchema.value === undefined ? undefined : (getSchemaDefaults(testSchema.value) ?? {})
  }

  const testData = ref<unknown>(getInitialTestData())

  const isSuccess = ref(false)

  const { summaryErrors, submit: submitForm } = useJsonSchemaForm(testSchema, testData)

  const {
    run,
    canRun: canTest,
    isRunning: isTesting,
    errorMessage: testErrorMessage,
  } = useXoPluginTestJob(plugin, testData)

  async function test() {
    isSuccess.value = false

    if (!submitForm()) {
      return
    }

    isSuccess.value = await runAction(run)
  }

  return { testSchema, testData, summaryErrors, isSuccess, test, canTest, isTesting, testErrorMessage, error }
}
