import type { VueWrapper } from '@vue/test-utils'

type FieldWrapper = Pick<VueWrapper, 'get' | 'emitted'>

/**
 * Sets the value of the field matching `selector` as the user would, and returns the `update:modelValue` events the
 * mounted component emitted, each as its argument list.
 */
export async function setFieldValue(wrapper: FieldWrapper, selector: string, value: string | boolean) {
  await wrapper.get(selector).setValue(value)

  return wrapper.emitted('update:modelValue')
}

/** Moves the focus out of the field matching `selector`, and returns the `blur` events the mounted component emitted. */
export async function blurField(wrapper: FieldWrapper, selector: string) {
  await wrapper.get(selector).trigger('blur')

  return wrapper.emitted('blur')
}
