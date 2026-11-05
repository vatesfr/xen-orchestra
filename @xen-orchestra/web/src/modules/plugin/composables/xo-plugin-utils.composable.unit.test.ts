import { useXoPluginUtils } from '@/modules/plugin/composables/xo-plugin-utils.composable.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

function mountUtils(plugin: FrontXoPlugin) {
  return mountComposable(() => ({ ...useXoPluginUtils(plugin), t: useI18n().t })).wrapper.vm
}

describe('description', () => {
  it('is the trimmed description of the plugin', () => {
    expect(mountUtils(createPlugin({ description: '  Send emails  ' })).description).toBe('Send emails')
  })

  it('is undefined when the plugin has no description', () => {
    expect(mountUtils(createPlugin({ description: undefined })).description).toBeUndefined()
  })
})

describe('isLoaded', () => {
  it.each([
    { loaded: true, isLoaded: true },
    { loaded: false, isLoaded: false },
    { loaded: undefined, isLoaded: false },
  ])('is $isLoaded for a plugin with $loaded as loaded', ({ loaded, isLoaded }) => {
    expect(mountUtils(createPlugin({ loaded })).isLoaded).toBe(isLoaded)
  })
})

describe('keywords', () => {
  it('are the keywords of the plugin', () => {
    expect(mountUtils(createPlugin({ keywords: ['ldap', 'auth'] })).keywords).toEqual(['ldap', 'auth'])
  })

  it('are empty when the plugin has no keywords', () => {
    expect(mountUtils(createPlugin({ keywords: undefined })).keywords).toEqual([])
  })
})

describe('configurationStatus', () => {
  it('is "not configurable" for a plugin without configuration schema', () => {
    const utils = mountUtils(createPlugin({ configurationSchema: undefined }))

    expect(utils.configurationStatus).toBe(utils.t('plugin:not-configurable'))
  })

  it('is "not configured" for a configurable plugin which is not configured', () => {
    const utils = mountUtils(createPlugin({ configurationSchema: { type: 'object' }, configured: false }))

    expect(utils.configurationStatus).toBe(utils.t('status:not-configured'))
  })

  it('is "configured" for a configured plugin, even without saved configuration', () => {
    const utils = mountUtils(
      createPlugin({ configurationSchema: { type: 'object' }, configuration: undefined, configured: true })
    )

    expect(utils.configurationStatus).toBe(utils.t('status:configured'))
  })

  it('follows the changes of the plugin', () => {
    const plugin = ref(createPlugin({ configurationSchema: { type: 'object' }, configured: false }))
    const { wrapper } = mountComposable(() => ({ ...useXoPluginUtils(plugin), t: useI18n().t }))

    plugin.value = createPlugin({ configurationSchema: { type: 'object' }, configured: true })

    expect(wrapper.vm.configurationStatus).toBe(wrapper.vm.t('status:configured'))
  })
})
