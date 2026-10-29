import { useV2vLaunchForm } from '@/modules/v2v/form/use-v2v-launch-form.ts'
import { createV2vLaunchSettings } from '@/test/create-v2v-launch.ts'
import { dangerMessage, requiredMessage } from '@/test/form-messages.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'

function mountLaunchForm() {
  return mountComposableWithI18n(() => useV2vLaunchForm())
}

async function validateConcurrency(concurrency: number) {
  const form = mountLaunchForm()
  form.formData.concurrency = concurrency

  return { form, isValid: await form.validate() }
}

// A cleared number input gives an empty string, whatever the type of its model
const EMPTY_INPUT = '' as unknown as number

describe('formData', () => {
  it('starts stopping the source VMs and on the first error, two VMs at a time', () => {
    expect(mountLaunchForm().formData).toEqual(createV2vLaunchSettings())
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
