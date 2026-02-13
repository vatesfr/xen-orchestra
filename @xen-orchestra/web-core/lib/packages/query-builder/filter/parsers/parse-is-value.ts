import { RegExpNode } from 'complex-matcher'
import { escapeRegExp } from 'lodash-es'

export function parseIsValue(value: string = '') {
  if (value.match(/^\d+$/)) {
    return value
  }

  return new RegExpNode(escapeRegExp(value)).toString().replace(/^\/(.*)\/$/, '/^$1$/')
}
