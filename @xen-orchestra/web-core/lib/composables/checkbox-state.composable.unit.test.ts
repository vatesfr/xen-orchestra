import { type CheckboxModel, useCheckboxState } from '@core/composables/checkbox-state.composable.ts'
import { ref } from 'vue'

describe('useCheckboxState', () => {
  it('is partly checked when the model is undefined', () => {
    const { isIndeterminate, isChecked, icon } = useCheckboxState(undefined, undefined)

    expect(isIndeterminate.value).toBe(true)
    expect(isChecked.value).toBe(false)
    expect(icon.value).toBe('status:checkbox-partially-checked')
  })

  it.each([
    { model: true, checked: true, icon: 'status:checkbox-checked' },
    { model: false, checked: false, icon: 'status:checkbox' },
  ])('reads a $model boolean model', ({ model, checked, icon }) => {
    const state = useCheckboxState(model, undefined)

    expect(state.isIndeterminate.value).toBe(false)
    expect(state.isChecked.value).toBe(checked)
    expect(state.icon.value).toBe(icon)
  })

  it.each([
    { value: 'nfs', checked: true, icon: 'status:checkbox-checked' },
    { value: 'smb', checked: false, icon: 'status:checkbox' },
  ])('checks an array model only when it contains the $value value', ({ value, checked, icon }) => {
    const state = useCheckboxState(['s3', 'nfs'], value)

    expect(state.isIndeterminate.value).toBe(false)
    expect(state.isChecked.value).toBe(checked)
    expect(state.icon.value).toBe(icon)
  })

  it('follows the model and the value', () => {
    const model = ref<CheckboxModel>(['s3'])
    const value = ref('nfs')
    const state = useCheckboxState(model, value)

    expect(state.isChecked.value).toBe(false)

    value.value = 's3'

    expect(state.isChecked.value).toBe(true)

    model.value = undefined

    expect(state.icon.value).toBe('status:checkbox-partially-checked')
  })
})
