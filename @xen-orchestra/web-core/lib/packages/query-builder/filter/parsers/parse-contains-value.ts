import { StringNode } from 'complex-matcher'

export function parseContainsValue(value: string = '') {
  return new StringNode(value).toString()
}
