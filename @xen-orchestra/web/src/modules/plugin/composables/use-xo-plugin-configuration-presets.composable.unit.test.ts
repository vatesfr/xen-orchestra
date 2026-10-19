import { useXoPluginConfigurationPresets } from '@/modules/plugin/composables/use-xo-plugin-configuration-presets.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useFormSelect } from '@core/packages/form-select'
import { computed, type MaybeRefOrGetter, type Ref, ref, shallowRef } from 'vue'

const { selectModel } = vi.hoisted(() => ({
  selectModel: { current: undefined as Ref<string | undefined> | undefined },
}))

vi.mock(import('@core/packages/form-select'), async importOriginal => {
  const original = await importOriginal()

  return {
    ...original,
    useFormSelect: ((sources: string[], config: { model: Ref<string | undefined> }) => {
      selectModel.current = config.model

      return original.useFormSelect(sources, config)
    }) as typeof useFormSelect,
  }
})

function selectPreset(name: string) {
  if (selectModel.current === undefined) {
    throw new Error('the preset select is not created')
  }

  selectModel.current.value = name
}

const gmailPreset = { from: { address: 'xo@gmail.com' }, transport: { host: 'smtp.gmail.com', port: 465 } }

const office365Preset = { from: { address: 'xo@outlook.com' }, transport: { host: 'smtp.office365.com' } }

const pluginWithPresets = createPlugin({
  configurationSchema: { type: 'object' },
  configurationPresets: { gmail: gmailPreset, office365: office365Preset },
})

const pluginWithoutGmailPreset = createPlugin({
  configurationSchema: { type: 'object' },
  configurationPresets: { office365: office365Preset },
})

function mountPresets(plugin: MaybeRefOrGetter<FrontXoPlugin>, initialConfiguration: unknown = {}) {
  const configurationValue = shallowRef(initialConfiguration)
  const configuration = computed({
    get: () => configurationValue.value,
    set: value => {
      configurationValue.value = value
    },
  })

  const { wrapper } = mountComposable(() => useXoPluginConfigurationPresets(plugin, configuration))

  return { presets: wrapper.vm, configurationValue }
}

describe('presetNames', () => {
  it('lists the presets of the plugin', () => {
    expect(mountPresets(pluginWithPresets).presets.presetNames).toEqual(['gmail', 'office365'])
  })

  it('is empty when the plugin has no presets', () => {
    expect(mountPresets(createPlugin({ configurationPresets: undefined })).presets.presetNames).toEqual([])
  })
})

describe('canApplyPreset', () => {
  it('is false until a preset is selected', () => {
    expect(mountPresets(pluginWithPresets).presets.canApplyPreset).toBe(false)
  })

  it('is true once a preset is selected', () => {
    const { presets } = mountPresets(pluginWithPresets)

    selectPreset('gmail')

    expect(presets.canApplyPreset).toBe(true)
  })
})

describe('applyPreset', () => {
  it('merges the selected preset into the configuration being edited', () => {
    const { presets, configurationValue } = mountPresets(pluginWithPresets, {
      from: { address: 'xo@example.org' },
      transport: { host: 'smtp.example.org', user: 'xo' },
    })

    selectPreset('gmail')
    presets.applyPreset()

    expect(configurationValue.value).toEqual({
      from: { address: 'xo@gmail.com' },
      transport: { host: 'smtp.gmail.com', port: 465, user: 'xo' },
    })
  })

  it('does not change the configuration without selected preset', () => {
    const configuration = { transport: { host: 'smtp.example.org' } }
    const { presets, configurationValue } = mountPresets(pluginWithPresets, configuration)

    presets.applyPreset()

    expect(configurationValue.value).toBe(configuration)
  })

  it('does not mutate the previous configuration', () => {
    const previous = { transport: { host: 'smtp.example.org' } }
    const { presets } = mountPresets(pluginWithPresets, previous)

    selectPreset('office365')
    presets.applyPreset()

    expect(previous).toEqual({ transport: { host: 'smtp.example.org' } })
  })

  it('does not change the configuration when the plugin no longer has the selected preset', () => {
    const plugin = ref<FrontXoPlugin>(pluginWithPresets)
    const configuration = { transport: { host: 'smtp.example.org' } }
    const { presets, configurationValue } = mountPresets(plugin, configuration)
    selectPreset('gmail')

    plugin.value = pluginWithoutGmailPreset
    presets.applyPreset()

    expect(configurationValue.value).toBe(configuration)
  })
})
