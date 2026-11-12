import { useOptionalValue } from '@/modules/plugin/composables/use-optional-value.composable.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { nextTick, ref } from 'vue'

function mountOptionalValue(initialValue: unknown, required = false) {
  const model = ref(initialValue)
  const isRequired = ref(required)

  const { wrapper } = mountComposable(() => ({
    isUsed: useOptionalValue(model, { required: isRequired, createValue: () => ({ port: 389 }) }),
  }))

  return { wrapper, model, isRequired }
}

describe('useOptionalValue', () => {
  it('is used when there is a value', () => {
    const { wrapper } = mountOptionalValue({})

    expect(wrapper.vm.isUsed).toBe(true)
  })

  it.each([undefined, null])('is not used when the value is %s', value => {
    const { wrapper } = mountOptionalValue(value)

    expect(wrapper.vm.isUsed).toBe(false)
  })

  it('is always used when the value is required', () => {
    const { wrapper } = mountOptionalValue(undefined, true)

    expect(wrapper.vm.isUsed).toBe(true)
  })

  it.each([undefined, null])('creates the value when it is used, from %s', value => {
    const { wrapper, model } = mountOptionalValue(value)

    wrapper.vm.isUsed = true

    expect(wrapper.vm.isUsed).toBe(true)
    expect(model.value).toEqual({ port: 389 })
  })

  it('keeps the current value when it is used again', () => {
    const { wrapper, model } = mountOptionalValue({ port: 636 })

    wrapper.vm.isUsed = true

    expect(model.value).toEqual({ port: 636 })
  })

  it('clears the value when it is not used anymore', () => {
    const { wrapper, model } = mountOptionalValue({ port: 636 })

    wrapper.vm.isUsed = false

    expect(wrapper.vm.isUsed).toBe(false)
    expect(model.value).toBeUndefined()
  })

  it('follows the value changed from the outside', async () => {
    const { wrapper, model } = mountOptionalValue(undefined)

    model.value = { port: 636 }
    await nextTick()

    expect(wrapper.vm.isUsed).toBe(true)

    model.value = undefined
    await nextTick()

    expect(wrapper.vm.isUsed).toBe(false)
  })

  it('follows the required state', () => {
    const { wrapper, isRequired } = mountOptionalValue(undefined)

    isRequired.value = true

    expect(wrapper.vm.isUsed).toBe(true)
  })
})
