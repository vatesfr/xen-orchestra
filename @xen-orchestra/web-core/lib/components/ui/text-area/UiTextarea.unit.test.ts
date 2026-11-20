import UiCharacterLimit from '@core/components/ui/character-limit/UiCharacterLimit.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiTextarea from '@core/components/ui/text-area/UiTextarea.vue'
import { blurField, setFieldValue } from '@core-test/field-events.ts'
import { findAccentedInfos } from '@core-test/find-accented-labels.ts'
import { t } from '@core-test/i18n.ts'
import { mountField } from '@core-test/mount-field.ts'
import { nextTick } from 'vue'

describe('UiTextarea', () => {
  it.each(['neutral', 'warning', 'danger'] as const)('applies the %s accent to the field and its label', accent => {
    const wrapper = mountField(UiTextarea, { accent }, { slots: { default: 'Label' } })
    const label = wrapper.getComponent(UiLabel)

    expect(wrapper.classes()).toContain(`accent--${accent}`)
    expect(label.props('accent')).toBe(accent)
    expect(label.text()).toBe('Label')
  })

  it('renders no label without the default slot', () => {
    expect(mountField(UiTextarea).findComponent(UiLabel).exists()).toBe(false)
  })

  it('forwards required, href and the id to the label, and the id to the textarea', () => {
    const wrapper = mountField(
      UiTextarea,
      { id: 'notes', required: true, href: 'https://docs.example' },
      { slots: { default: 'Label' } }
    )

    expect(wrapper.getComponent(UiLabel).props()).toMatchObject({
      for: 'notes',
      required: true,
      href: 'https://docs.example',
    })
    expect(wrapper.get('textarea').attributes('id')).toBe('notes')
  })

  it('links the label to the textarea with a generated id when none is given', () => {
    const wrapper = mountField(UiTextarea, {}, { slots: { default: 'Label' } })
    const textareaId = wrapper.get('textarea').attributes('id')

    expect(textareaId).toBeTruthy()
    expect(wrapper.getComponent(UiLabel).props('for')).toBe(textareaId)
  })

  it('forwards the disabled state and extra attributes to the textarea, not the root', () => {
    const wrapper = mountField(UiTextarea, { disabled: true }, { attrs: { placeholder: 'Notes' } })
    const textarea = wrapper.get('textarea')

    expect(textarea.element.value).toBe('Value')
    expect(textarea.attributes()).toMatchObject({ placeholder: 'Notes', disabled: '' })
    expect(wrapper.attributes('placeholder')).toBeUndefined()
  })

  it('updates the model while typing', async () => {
    expect(await setFieldValue(mountField(UiTextarea), 'textarea', 'New value')).toEqual([['New value']])
  })

  it.each([
    ['without maxCharacters', undefined],
    ['when maxCharacters is 0', 0],
  ])('shows no character count and no limit error %s', (_case, maxCharacters) => {
    const wrapper = mountField(UiTextarea, { modelValue: 'A long value', maxCharacters })

    expect(wrapper.findComponent(UiCharacterLimit).exists()).toBe(false)
    expect(findAccentedInfos(wrapper)).toEqual([])
    expect(wrapper.classes()).toContain('accent--neutral')
  })

  it('counts the trimmed characters against maxCharacters', () => {
    const wrapper = mountField(UiTextarea, { modelValue: '  abc  ', maxCharacters: 10 })

    expect(wrapper.getComponent(UiCharacterLimit).props()).toEqual({ count: 3, max: 10 })
  })

  it('switches to danger with an error once the trimmed value exceeds maxCharacters, the label keeping its accent', () => {
    const wrapper = mountField(UiTextarea, { modelValue: 'abcd', maxCharacters: 3 }, { slots: { default: 'Label' } })

    expect(wrapper.classes()).toContain('accent--danger')
    expect(findAccentedInfos(wrapper)).toEqual([
      { label: t('field:exceeds-max-characters', { max: 3 }), accent: 'danger' },
    ])
    expect(wrapper.getComponent(UiLabel).props('accent')).toBe('neutral')
  })

  it.each([
    { case: 'at the limit', modelValue: 'abc' },
    { case: 'over it only with surrounding spaces', modelValue: '  abc  ' },
  ])('keeps its accent and shows no error $case', ({ modelValue }) => {
    const wrapper = mountField(UiTextarea, { accent: 'warning', modelValue, maxCharacters: 3 })

    expect(wrapper.classes()).toContain('accent--warning')
    expect(findAccentedInfos(wrapper)).toEqual([])
  })

  it('waits for the textarea to lose the focus before reporting the exceeded limit', async () => {
    const wrapper = mountField(UiTextarea, { modelValue: 'abcd', maxCharacters: 3 })
    const textarea = wrapper.get('textarea')

    // useFocus attaches its listeners once the template ref is set
    await nextTick()
    await textarea.trigger('focus')

    expect(wrapper.classes()).toContain('accent--neutral')
    expect(findAccentedInfos(wrapper)).toEqual([])

    await blurField(wrapper, 'textarea')

    expect(wrapper.classes()).toContain('accent--danger')
  })

  it.each([
    { accent: 'neutral', infos: [] },
    { accent: 'warning', infos: [{ label: 'Message', accent: 'warning' }] },
    { accent: 'danger', infos: [{ label: 'Message', accent: 'danger' }] },
  ] as const)('shows the message slot only with a warning or danger accent ($accent)', ({ accent, infos }) => {
    expect(findAccentedInfos(mountField(UiTextarea, { accent }, { slots: { message: 'Message' } }))).toEqual(infos)
  })

  it('shows the info slot as an info message, before the message', () => {
    const wrapper = mountField(UiTextarea, { accent: 'danger' }, { slots: { info: 'Info', message: 'Message' } })

    expect(findAccentedInfos(wrapper)).toEqual([
      { label: 'Info', accent: 'info' },
      { label: 'Message', accent: 'danger' },
    ])
  })
})
