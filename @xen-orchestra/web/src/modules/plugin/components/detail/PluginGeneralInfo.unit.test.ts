import PluginGeneralInfo from '@/modules/plugin/components/detail/PluginGeneralInfo.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { findTitles } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountCard(plugin: FrontXoPlugin = createPlugin()) {
  return mount(PluginGeneralInfo, { props: { plugin }, global: createGlobalTestConfig() })
}

function findKeywords(wrapper: ReturnType<typeof mountCard>) {
  return wrapper.findAll('.ui-tag').map(tag => tag.text())
}

it('titles the card as general information', () => {
  const wrapper = mountCard()

  expect(findTitles(wrapper)).toEqual([t('general-information')])
})

it('shows the description of the plugin', () => {
  const wrapper = mountCard(createPlugin({ description: 'Send emails' }))

  expect(findLabelledValues(wrapper)[t('description')]).toBe('Send emails')
})

it('shows the keywords of the plugin as tags', () => {
  const wrapper = mountCard(createPlugin({ keywords: ['email', 'xo-server'] }))

  expect(findKeywords(wrapper)).toEqual(['email', 'xo-server'])
})

it('shows no tag for a plugin without keywords', () => {
  const wrapper = mountCard(createPlugin({ keywords: [] }))

  expect(findKeywords(wrapper)).toEqual([])
  expect(Object.keys(findLabelledValues(wrapper))).toEqual([t('description'), t('keywords')])
})
