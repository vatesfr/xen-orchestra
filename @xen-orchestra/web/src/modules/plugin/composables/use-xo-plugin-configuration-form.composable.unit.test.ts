import { useXoPluginConfigurationForm } from '@/modules/plugin/composables/use-xo-plugin-configuration-form.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { type MaybeRefOrGetter, nextTick, ref } from 'vue'

const configurationSchema = {
  type: 'object',
  properties: {
    from: { type: 'object', properties: { address: { type: 'string' } }, required: ['address'] },
    transport: {
      type: 'object',
      properties: { host: { type: 'string' }, port: { type: 'integer', default: 25 } },
      required: ['host'],
    },
  },
  required: ['from', 'transport'],
} satisfies JsonSchema

const savedConfiguration = { from: { address: 'xo@example.org' }, transport: { host: 'smtp.example.org', port: 587 } }

const editedConfiguration = { from: { address: 'xo@example.org' }, transport: { host: 'smtp.example.net' } }

const unconfiguredPlugin = createPlugin({ configurationSchema, configuration: undefined, configured: false })

const configuredPlugin = createPlugin({ configurationSchema, configuration: savedConfiguration, configured: true })

function mountConfigurationForm(plugin: MaybeRefOrGetter<FrontXoPlugin>) {
  return mountComposable(() => useXoPluginConfigurationForm(plugin)).wrapper.vm
}

describe('formValue', () => {
  it('starts with the saved configuration', () => {
    expect(mountConfigurationForm(configuredPlugin).formValue).toEqual(savedConfiguration)
  })

  it('starts with the defaults of the schema when nothing is saved', () => {
    expect(mountConfigurationForm(unconfiguredPlugin).formValue).toEqual({ transport: { port: 25 } })
  })

  it('keeps the edits when the plugin is updated', async () => {
    const plugin = ref(configuredPlugin)
    const form = mountConfigurationForm(plugin)
    form.formValue = editedConfiguration

    plugin.value = createPlugin({ ...configuredPlugin, configuration: { from: { address: 'admin@example.org' } } })
    await nextTick()

    expect(form.formValue).toEqual(editedConfiguration)
  })
})

describe('submit', () => {
  it('rejects a configuration with missing fields, and lists them', () => {
    const form = mountConfigurationForm(unconfiguredPlugin)

    expect(form.submit()).toBe(false)
    expect(form.summaryErrors.map(error => error.path)).toEqual([
      ['from', 'address'],
      ['transport', 'host'],
    ])
  })

  it('accepts a valid configuration', () => {
    const form = mountConfigurationForm(unconfiguredPlugin)
    form.formValue = savedConfiguration

    expect(form.submit()).toBe(true)
    expect(form.summaryErrors).toEqual([])
  })
})
