import { useXoPluginTestForm } from '@/modules/plugin/composables/use-xo-plugin-test-form.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const testSchema = {
  type: 'object',
  properties: {
    to: { type: 'string' },
    subject: { type: 'string', default: 'Test' },
  },
  required: ['to'],
} satisfies JsonSchema

const testablePlugin = createPlugin({ testable: true, testSchema })

const pluginWithoutTestSchema = createPlugin({ testable: true, testSchema: undefined })

function mountTestForm(plugin: FrontXoPlugin) {
  return mountComposable(() => useXoPluginTestForm(plugin)).wrapper.vm
}

describe('testData', () => {
  it('starts with the defaults of the test schema', () => {
    expect(mountTestForm(testablePlugin).testData).toEqual({ subject: 'Test' })
  })

  it('starts empty when the test schema has no defaults', () => {
    const plugin = createPlugin({
      testable: true,
      testSchema: { type: 'object', properties: { to: { type: 'string' } } },
    })

    expect(mountTestForm(plugin).testData).toEqual({})
  })

  it('is undefined when the plugin has no test schema', () => {
    expect(mountTestForm(pluginWithoutTestSchema).testData).toBeUndefined()
  })
})

describe('submit', () => {
  it('rejects test data with missing fields, and lists them', () => {
    const form = mountTestForm(testablePlugin)

    expect(form.submit()).toBe(false)
    expect(form.summaryErrors.map(error => error.path)).toEqual([['to']])
  })

  it('accepts valid test data', () => {
    const form = mountTestForm(testablePlugin)
    form.testData = { to: 'admin@example.org' }

    expect(form.submit()).toBe(true)
  })

  it('accepts a test without test schema', () => {
    expect(mountTestForm(pluginWithoutTestSchema).submit()).toBe(true)
  })
})
