import { createV2vLaunchSettings } from '@/test/create-v2v-launch.ts'
import { dangerMessage, requiredMessage } from '@/test/form-messages.ts'
import { mountV2vLaunchForm } from '@/test/mount-v2v-launch-form.ts'

async function validateConcurrency(concurrency: number) {
  const form = mountV2vLaunchForm()
  form.formData.concurrency = concurrency

  return { form, isValid: await form.validate() }
}

// A cleared number input gives an empty string, whatever the type of its model
const EMPTY_INPUT = '' as unknown as number

describe('formData', () => {
  it('starts stopping the source VMs and on the first error, two VMs at a time', () => {
    expect(mountV2vLaunchForm().formData).toEqual(createV2vLaunchSettings())
  })
})

describe('stopSourceCheckboxBindings', () => {
  it('labels the stop of the source VM and tells when it happens', () => {
    const form = mountV2vLaunchForm()

    expect(form.stopSourceCheckboxBindings).toMatchObject({
      label: form.t('v2v:stop-source-vm'),
      info: form.t('v2v:stop-source-vm-info'),
    })
  })
})

describe('stopOnErrorCheckboxBindings', () => {
  it('labels the stop on error and tells it applies to the whole launch', () => {
    const form = mountV2vLaunchForm()

    expect(form.stopOnErrorCheckboxBindings).toMatchObject({
      label: form.t('stop-on-error'),
      info: form.t('v2v:stop-on-error-info'),
    })
  })
})

describe('concurrencyInputBindings', () => {
  it('labels the concurrency, required', () => {
    const form = mountV2vLaunchForm()

    expect(form.concurrencyInputBindings).toMatchObject({ label: form.t('concurrency'), required: true })
  })
})

describe('validate', () => {
  it.each([0, 9])('reports a concurrency of %s as out of the 1 to 8 range', async concurrency => {
    const { form, isValid } = await validateConcurrency(concurrency)

    expect(isValid).toBe(false)
    expect(form.concurrencyInputBindings.error).toEqual(
      dangerMessage(form.t('form:warning:out-of-range', { min: 1, max: 8 }))
    )
  })

  it('reports a concurrency that is not an integer', async () => {
    const { form, isValid } = await validateConcurrency(1.5)

    expect(isValid).toBe(false)
    expect(form.concurrencyInputBindings.error).toEqual(dangerMessage(form.t('form:error:integer')))
  })

  it('reports a missing concurrency', async () => {
    const { form, isValid } = await validateConcurrency(EMPTY_INPUT)

    expect(isValid).toBe(false)
    expect(form.concurrencyInputBindings.error).toEqual(requiredMessage())
  })

  it.each([1, 8])('accepts a concurrency of %s', async concurrency => {
    const { form, isValid } = await validateConcurrency(concurrency)

    expect(isValid).toBe(true)
    expect(form.concurrencyInputBindings.error).toBeUndefined()
  })
})
