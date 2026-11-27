import VtsSuccessStateHero from '@core/components/success-state-hero/VtsSuccessStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { getSuccessState } from '@core-test/get-success-state.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { Window as HappyDomWindow } from 'happy-dom'

function mountSuccessStateHero({ width = 1024, title }: { width?: number; title?: string } = {}) {
  ;(window as unknown as HappyDomWindow).happyDOM.setViewport({ width })

  return mount(VtsSuccessStateHero, {
    global: createGlobalTestConfig(),
    slots: {
      default: 'Message',
      actions: '<button>Action</button>',
      ...(title !== undefined && { title }),
    },
  })
}

function findWidthClasses(wrapper: VueWrapper, selector: string) {
  return wrapper
    .get(selector)
    .classes()
    .filter(className => className === 'mobile' || className === 'medium')
}

describe('VtsSuccessStateHero', () => {
  it.each([
    { label: 'renders the title when one is passed', title: 'Title', expected: 'Title' },
    { label: 'renders no title when none is passed', title: undefined, expected: undefined },
  ])('$label', ({ title, expected }) => {
    expect(getSuccessState(mountSuccessStateHero({ title })).title).toBe(expected)
  })

  it('renders the message in a success alert', () => {
    const wrapper = mountSuccessStateHero()

    expect(wrapper.getComponent(UiAlert).props('accent')).toBe('success')
    expect(getSuccessState(wrapper).message).toBe('Message')
  })

  it('renders the actions', () => {
    expect(mountSuccessStateHero().get('.action-buttons').text()).toBe('Action')
  })

  it.each([
    { width: 1023, content: ['mobile'], actions: ['mobile'] },
    { width: 1024, content: ['medium'], actions: [] },
    { width: 1440, content: ['medium'], actions: [] },
    { width: 1441, content: [], actions: [] },
  ])('sets the width classes of a $width px wide screen', ({ width, content, actions }) => {
    const wrapper = mountSuccessStateHero({ width })

    expect(findWidthClasses(wrapper, '.container > .content')).toEqual(content)
    expect(findWidthClasses(wrapper, '.action-buttons')).toEqual(actions)
  })
})
