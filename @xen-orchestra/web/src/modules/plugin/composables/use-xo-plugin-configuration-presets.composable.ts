import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { useFormSelect } from '@core/packages/form-select'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { merge } from 'lodash-es'
import { computed, type MaybeRefOrGetter, type Ref, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoPluginConfigurationPresets(
  rawPlugin: MaybeRefOrGetter<FrontXoPlugin>,
  configuration: Ref<unknown>
) {
  const plugin = toComputed(rawPlugin)

  const { t } = useI18n()

  const presetNames = computed(() => Object.keys(plugin.value.configurationPresets ?? {}))

  const selectedPreset = ref<string>()

  const { id: presetSelectId } = useFormSelect(presetNames, {
    model: selectedPreset,
    placeholder: () => t('select-preset'),
  })

  const canApplyPreset = computed(() => selectedPreset.value !== undefined)

  function applyPreset() {
    if (selectedPreset.value === undefined) {
      return
    }

    const presets: Record<string, object> | undefined = plugin.value.configurationPresets
    const preset = presets?.[selectedPreset.value]

    if (preset !== undefined) {
      configuration.value = merge({}, configuration.value, preset)
    }
  }

  return { presetNames, presetSelectId, canApplyPreset, applyPreset }
}
