import { getPluginDescription, getPluginRoute, isPluginLoaded } from '@/modules/plugin/utils/xo-plugin.util.ts'
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

describe('isPluginLoaded', () => {
  it.each([
    { loaded: true, expected: true },
    { loaded: false, expected: false },
    { loaded: undefined, expected: false },
  ])('is $expected for a plugin with $loaded as loaded', ({ loaded, expected }) => {
    expect(isPluginLoaded(createPlugin({ loaded }))).toBe(expected)
  })
})

describe('getPluginRoute', () => {
  it('is the page of the plugin', () => {
    expect(getPluginRoute(createPlugin().id)).toEqual({
      name: '/admin/plugin/[id]',
      params: { id: 'transport-email' },
    })
  })
})
