import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import type { IconName } from '@core/icons'
import { setFieldValue } from '@core-test/field-events.ts'
import { mountField } from '@core-test/mount-field.ts'
import type { VueWrapper } from '@vue/test-utils'

function findIcon(wrapper: VueWrapper, name: IconName) {
  return wrapper.findAllComponents(VtsIcon).find(icon => icon.props('name') === name)
}

const SUCCESS_ICON: IconName = 'status:success-circle'

describe('UiInput', () => {
  it.each(['neutral', 'warning', 'danger', 'success'] as const)('applies the %s accent', accent => {
    expect(mountField(UiInput, { accent }).classes()).toContain(`accent--${accent}`)
  })

  it.each(['disabled', 'selected'] as const)('applies the %s variant only when set', variant => {
    expect(mountField(UiInput, { [variant]: true }).classes()).toContain(variant)
    expect(mountField(UiInput).classes()).not.toContain(variant)
  })

  it('forwards the value, the type, the states and extra attributes to the input', () => {
    const input = mountField(UiInput, { type: 'password', disabled: true, required: true, id: 'name' }).get('input')

    expect(input.element.value).toBe('Value')
    expect(input.attributes()).toMatchObject({ type: 'password', id: 'name', disabled: '', required: '' })
  })

  it('forwards attributes it does not declare to the input', () => {
    const wrapper = mountField(UiInput, {}, { attrs: { placeholder: 'Name' } })

    expect(wrapper.get('input').attributes('placeholder')).toBe('Name')
    expect(wrapper.attributes('placeholder')).toBeUndefined()
  })

  it('updates the model while typing', async () => {
    expect(await setFieldValue(mountField(UiInput), 'input', 'New value')).toEqual([['New value']])
  })

  it.each([
    { label: 'not clearable', props: { clearable: false } },
    { label: 'empty', props: { clearable: true, modelValue: '' } },
    { label: 'disabled', props: { clearable: true, disabled: true } },
    { label: 'readonly', props: { clearable: true, readonly: true } },
  ])('hides the clear button when $label', ({ props }) => {
    expect(mountField(UiInput, props).findComponent(UiButtonIcon).exists()).toBe(false)
  })

  it('clears the value, emits clear and focuses the input on the clear button', async () => {
    const wrapper = mountField(UiInput, { clearable: true })

    await wrapper.getComponent(UiButtonIcon).trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('clear')).toHaveLength(1)
    expect(document.activeElement).toBe(wrapper.get('input').element)
  })

  it('shows the success icon after the clear button with the success accent', () => {
    const wrapper = mountField(UiInput, { accent: 'success', clearable: true })
    const successIcon = findIcon(wrapper, SUCCESS_ICON)

    expect(successIcon?.element.previousElementSibling).toBe(wrapper.getComponent(UiButtonIcon).element)
  })

  it.each([
    { label: 'another accent', props: { accent: 'warning' } },
    { label: 'disabled', props: { accent: 'success', disabled: true } },
    { label: 'busy', props: { accent: 'success', busy: true } },
    { label: 'readonly', props: { accent: 'success', readonly: true } },
  ] as const)('hides the success icon when $label', ({ props }) => {
    expect(findIcon(mountField(UiInput, props), SUCCESS_ICON)).toBeUndefined()
  })

  it.each([
    { busy: true, loader: true, ariaBusy: 'true' },
    { busy: false, loader: false, ariaBusy: undefined },
  ])('shows the loader and aria-busy only when busy is $busy', ({ busy, loader, ariaBusy }) => {
    const wrapper = mountField(UiInput, { busy })

    expect(wrapper.findComponent(UiLoader).exists()).toBe(loader)
    expect(wrapper.get('input').attributes('aria-busy')).toBe(ariaBusy)
  })

  it('renders a readonly value as text with a readonly input', () => {
    const wrapper = mountField(UiInput, { readonly: true })

    expect(wrapper.text()).toBe('Value')
    expect(wrapper.get('input').attributes('readonly')).toBeDefined()
  })

  it('renders an editable input when not readonly', () => {
    expect(mountField(UiInput).get('input').attributes('readonly')).toBeUndefined()
  })

  describe.each(['prefix', 'suffix'] as const)('%s', part => {
    it('renders the prop', () => {
      expect(
        mountField(UiInput, { [part]: 'Unit' })
          .get(`.${part}`)
          .text()
      ).toBe('Unit')
    })

    it('renders the slot instead of the prop', () => {
      expect(
        mountField(UiInput, { [part]: 'Unit' }, { slots: { [part]: 'Slot' } })
          .get(`.${part}`)
          .text()
      ).toBe('Slot')
    })

    it('renders nothing without prop or slot', () => {
      expect(mountField(UiInput).find(`.${part}`).exists()).toBe(false)
    })
  })

  it('renders the right icon prop', () => {
    expect(findIcon(mountField(UiInput, { rightIcon: 'status:info-circle' }), 'status:info-circle')).toBeDefined()
  })

  it('renders the right-icon slot instead of the icon', () => {
    const wrapper = mountField(
      UiInput,
      { rightIcon: 'status:info-circle' },
      { slots: { 'right-icon': '<span class="custom">Icon</span>' } }
    )

    expect(wrapper.find('.custom').exists()).toBe(true)
    expect(findIcon(wrapper, 'status:info-circle')).toBeUndefined()
  })

  it('renders no icon without right icon, clear button or success', () => {
    expect(mountField(UiInput).findAllComponents(VtsIcon)).toHaveLength(0)
  })

  it('focuses the input on a click on the field', async () => {
    const wrapper = mountField(UiInput)

    await wrapper.trigger('click')

    expect(document.activeElement).toBe(wrapper.get('input').element)
  })

  it('exposes focus', () => {
    const wrapper = mountField(UiInput)

    wrapper.vm.focus()

    expect(document.activeElement).toBe(wrapper.get('input').element)
  })
})
