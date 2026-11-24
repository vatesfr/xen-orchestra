import type { DOMWrapper, VueWrapper } from '@vue/test-utils'

// A readonly input renders its placeholder as text, in place of its value
export function isPlaceholderShown(field: Pick<VueWrapper | DOMWrapper<Element>, 'find'>) {
  return field.find('.placeholder').exists()
}
