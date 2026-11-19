import UiLink from '@core/components/ui/link/UiLink.vue'
import type { DOMWrapper, VueWrapper } from '@vue/test-utils'

type ReadableLink = Pick<DOMWrapper<Element>, 'text' | 'attributes'>

// Every `UiLink` of a wrapper (or, given a `selector`, every plain link it matches) as its `[text, href]`, in order
export function findLinks(
  wrapper: Pick<VueWrapper, 'findAll' | 'findAllComponents'>,
  selector?: string
): [string, string | undefined][] {
  const links: ReadableLink[] = selector === undefined ? wrapper.findAllComponents(UiLink) : wrapper.findAll(selector)

  return links.map(link => [link.text(), link.attributes('href')])
}
