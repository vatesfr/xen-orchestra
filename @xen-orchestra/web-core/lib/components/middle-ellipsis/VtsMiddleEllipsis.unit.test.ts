import VtsMiddleEllipsis from '@core/components/middle-ellipsis/VtsMiddleEllipsis.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { flushPromises, mount } from '@vue/test-utils'

class ImmediateResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe() {
    this.callback([], this as unknown as ResizeObserver)
  }

  unobserve() {}

  disconnect() {}
}

async function mountMiddleEllipsis(text: string, tailLength?: number) {
  const wrapper = mount(VtsMiddleEllipsis, { global: createGlobalTestConfig(), props: { text, tailLength } })

  await flushPromises()

  return wrapper
}

async function findParts(text: string, tailLength?: number) {
  const wrapper = await mountMiddleEllipsis(text, tailLength)
  const head = wrapper.find('.head')
  const tail = wrapper.find('.tail')

  return {
    head: head.exists() ? head.text() : undefined,
    tail: tail.exists() ? tail.text() : undefined,
  }
}

describe('VtsMiddleEllipsis', () => {
  it('renders the text as is when it fits', async () => {
    const wrapper = await mountMiddleEllipsis('prod-web-frontend-eu-west-01')

    expect(wrapper.text()).toBe('prod-web-frontend-eu-west-01')
    expect(wrapper.find('.head').exists()).toBe(false)
    expect(wrapper.findAll('[aria-hidden="true"]')).toHaveLength(0)
  })

  describe('when the text overflows', () => {
    beforeEach(() => {
      vi.stubGlobal('ResizeObserver', ImmediateResizeObserver)
      vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockReturnValue(200)
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100)
    })

    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    })

    it.each([
      {
        label: 'keeps the last 10 characters by default',
        tailLength: undefined,
        head: 'prod-web-frontend-',
        tail: 'eu-west-01',
      },
      { label: 'keeps the given number of characters', tailLength: 4, head: 'prod-web-frontend-eu-wes', tail: 't-01' },
    ])('$label', async ({ tailLength, head, tail }) => {
      expect(await findParts('prod-web-frontend-eu-west-01', tailLength)).toEqual({ head, tail })
    })

    it('keeps an emoji whole when it falls on the cut', async () => {
      expect(await findParts('ab🎨cd', 3)).toEqual({ head: 'ab', tail: '🎨cd' })
    })

    it('does not cut a text that is not longer than the kept end', async () => {
      expect(await findParts('short')).toEqual({ head: undefined, tail: undefined })
    })

    it('renders the text once, with the parts hidden from assistive technologies', async () => {
      const wrapper = await mountMiddleEllipsis('prod-web-frontend-eu-west-01')

      expect(wrapper.text()).toBe('prod-web-frontend-eu-west-01')
      expect(wrapper.attributes('data-text')).toBe('prod-web-frontend-eu-west-01')
      expect(wrapper.findAll('[aria-hidden="true"]')).toHaveLength(2)
    })

    it('cuts a new text that overflows', async () => {
      const wrapper = await mountMiddleEllipsis('short')

      await wrapper.setProps({ text: 'prod-web-frontend-eu-west-01' })
      await flushPromises()

      expect(wrapper.get('.tail').text()).toBe('eu-west-01')
    })
  })
})
