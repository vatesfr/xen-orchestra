import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { t } from '@core-test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountViewer(autoScroll: boolean) {
  const wrapper = mount(UiLogEntryViewer, {
    props: { label: 'Logs', content: 'a', size: 'small', accent: 'info', autoScroll },
    global: createGlobalTestConfig(),
  })
  const element = wrapper.find('code').element
  // no layout in happy-dom: 100px per line, one line visible
  Object.defineProperty(element, 'scrollHeight', { get: () => element.textContent!.trim().split('\n').length * 100 })
  Object.defineProperty(element, 'clientHeight', { value: 100 })
  Object.defineProperty(element, 'scrollTop', { value: 0, writable: true })

  return { wrapper, element }
}

describe('UiLogEntryViewer', () => {
  it('gives an accessible name to its icon-only open button', () => {
    const { wrapper } = mountViewer(false)

    expect(wrapper.findAll('.actions button').at(-1)?.attributes('aria-label')).toBe(t('action:open-in-new-tab'))
  })

  it('follows the new lines with `autoScroll`, only while the user stays at the bottom', async () => {
    const { wrapper, element } = mountViewer(true)

    await wrapper.setProps({ content: 'a\nb' })
    expect(element.scrollTop).toBe(200)

    // scrolled up to read: stays there
    element.scrollTop = 0
    await wrapper.setProps({ content: 'a\nb\nc' })
    expect(element.scrollTop).toBe(0)
  })

  it('does not scroll without `autoScroll`', async () => {
    const { wrapper, element } = mountViewer(false)

    await wrapper.setProps({ content: 'a\nb' })
    expect(element.scrollTop).toBe(0)
  })
})
