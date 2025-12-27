import { RegExpNode } from 'complex-matcher'
import { escapeRegExp } from 'lodash-es'

export function parseStartsWithValue(value: string = '') {
  return new RegExpNode(escapeRegExp(value)).toString().replace(/^\/(.*)\/$/, '/^$1/i')
}
