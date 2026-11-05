import { useXoPluginConfigurationPresets } from '@/modules/plugin/composables/use-xo-plugin-configuration-presets.composable.ts'
import { useJsonSchemaForm } from '@/modules/plugin/form/use-json-schema-form.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { getSchemaDefaults } from '@/modules/plugin/utils/json-schema.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

export function useXoPluginConfigurationForm(rawPlugin: MaybeRefOrGetter<FrontXoPlugin>) {
  const plugin = toComputed(rawPlugin)

  const schema = computed(() => plugin.value.configurationSchema)

  // read once, so that a plugin update received while editing does not discard the edits
  function getInitialConfiguration() {
    return plugin.value.configuration ?? getSchemaDefaults(schema.value)
  }

  const formValue = ref<unknown>(getInitialConfiguration())

  const { summaryErrors, submit } = useJsonSchemaForm(schema, formValue)

  const { presetNames, presetSelectId, canApplyPreset, applyPreset } = useXoPluginConfigurationPresets(
    plugin,
    formValue
  )

  return { schema, formValue, summaryErrors, submit, presetNames, presetSelectId, canApplyPreset, applyPreset }
}
