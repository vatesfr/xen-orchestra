import { focusField } from '@/modules/plugin/json-schema-form/focus-field.util.ts'

function renderField(html: string) {
  document.body.innerHTML = html

  return document.body.firstElementChild as HTMLElement
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('focusField', () => {
  it('focuses the input of the field', () => {
    renderField('<div id="field-host"><label>Host</label><input /></div>')

    focusField('field-host')

    expect(document.activeElement).toBe(document.querySelector('#field-host input'))
  })

  it('focuses the textarea of a multiline field', () => {
    renderField('<div id="field-certificate"><textarea></textarea></div>')

    focusField('field-certificate')

    expect(document.activeElement).toBe(document.querySelector('#field-certificate textarea'))
  })

  it('scrolls to the field', () => {
    const field = renderField('<div id="field-host"><input /></div>')
    const scrollIntoView = vi.spyOn(field, 'scrollIntoView')

    focusField('field-host')

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' })
  })

  it('does nothing for an unknown field', () => {
    renderField('<div id="field-host"><input /></div>')

    expect(() => focusField('field-unknown')).not.toThrow()
    expect(document.activeElement).toBe(document.body)
  })
})
