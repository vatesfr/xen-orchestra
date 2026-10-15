import { getPluginDescription } from '@/modules/plugin/utils/xo-plugin.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'

describe('getPluginDescription', () => {
  it('trims the description', () => {
    expect(getPluginDescription(createPlugin({ description: '  Foo plugin\n' }))).toBe('Foo plugin')
  })

  it('is undefined when the plugin has no description', () => {
    expect(getPluginDescription(createPlugin({ description: undefined }))).toBeUndefined()
  })

  it('is empty for a blank description', () => {
    expect(getPluginDescription(createPlugin({ description: ' \n' }))).toBe('')
  })
})
