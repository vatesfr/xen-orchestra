import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiColumnHeader from '@core/components/ui/column-header/UiColumnHeader.vue'
import { createGlobalTestConfig } from '@core-test/create-global-test-config.ts'
import { mount } from '@vue/test-utils'

function mountColumnHeader(props: Partial<InstanceType<typeof UiColumnHeader>['$props']> = {}) {
  return mount(UiColumnHeader, {
    global: createGlobalTestConfig(),
    props: { interactive: false, selected: false, ...props },
    slots: { default: 'Name' },
  })
}

it('renders the label directly in the header cell', () => {
  const wrapper = mountColumnHeader()

  expect(wrapper.get('th').text()).toBe('Name')
  expect(wrapper.find('button').exists()).toBe(false)
})

describe('when interactive', () => {
  it('renders the label and the icon in a button', () => {
    const button = mountColumnHeader({ interactive: true, icon: 'fa:arrow-up' }).get('th > button')

    expect(button.text()).toBe('Name')
    expect(button.getComponent(VtsIcon).props('name')).toBe('fa:arrow-up')
  })

  it('emits click when the button is clicked', async () => {
    const wrapper = mountColumnHeader({ interactive: true })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('applies the button attributes', () => {
    const button = mountColumnHeader({
      interactive: true,
      buttonAttrs: { 'aria-haspopup': 'menu', 'aria-expanded': true },
    }).get('button')

    expect(button.attributes()).toMatchObject({ 'aria-haspopup': 'menu', 'aria-expanded': 'true' })
  })

  it.each([
    { selected: true, expected: true },
    { selected: false, expected: false },
  ])('marks the button as selected: $selected', ({ selected, expected }) => {
    const button = mountColumnHeader({ interactive: true, selected }).get('button')

    expect(button.classes('selected')).toBe(expected)
  })

  it('disables the button', async () => {
    const wrapper = mountColumnHeader({ interactive: true, disabled: true })

    await wrapper.get('button').trigger('click')

    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
