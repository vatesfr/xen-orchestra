import { required } from '@core/packages/form-validation'
import { defineFormSteps, useMultiStepValidatedForm } from '@core/packages/validated-form'
import { nextTick } from 'vue'

function useOrderForm() {
  const formData = defineFormSteps({
    product: { category: 'books' },
    delivery: { addresses: ['home'] },
  })

  const form = useMultiStepValidatedForm(formData, {
    product: {},
    delivery: {
      errors: { onSubmit: () => ({ addresses: { required } }) },
    },
  })

  return { formData, addressesField: form.useField('addresses'), ...form }
}

describe('markStepUntouched', () => {
  it('clears the error of a value emptied from code', async () => {
    const { formData, addressesField, markStepUntouched } = useOrderForm()

    formData.delivery.addresses = []
    await nextTick()

    expect(addressesField.value.error).toBeDefined()

    markStepUntouched('delivery')
    await nextTick()

    expect(addressesField.value.error).toBeUndefined()
  })

  it('keeps the values of the step', () => {
    const { formData, markStepUntouched } = useOrderForm()

    markStepUntouched('delivery')

    expect(formData.delivery.addresses).toEqual(['home'])
  })

  it('forgets the validation result of the step', async () => {
    const { isStepValid, validateStep, markStepUntouched } = useOrderForm()

    await validateStep('delivery')

    expect(isStepValid('delivery')).toBe(true)

    markStepUntouched('delivery')

    expect(isStepValid('delivery')).toBeUndefined()
  })

  it('does not affect the other steps', async () => {
    const { isStepValid, validateStep, markStepUntouched } = useOrderForm()

    await validateStep('product')
    markStepUntouched('delivery')

    expect(isStepValid('product')).toBe(true)
  })

  it('still reports the error on the next validation', async () => {
    const { formData, addressesField, validateStep, markStepUntouched } = useOrderForm()

    formData.delivery.addresses = []
    markStepUntouched('delivery')

    expect(await validateStep('delivery')).toBe(false)
    expect(addressesField.value.error).toBeDefined()
  })
})
