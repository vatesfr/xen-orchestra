import { RegExpNode } from 'complex-matcher'
import { escapeRegExp } from 'lodash-es'

export function parseEndsWithValue(value: string = '') {
  return new RegExpNode(escapeRegExp(value)).toString().replace(/^\/(.*)\/$/, '/$1$/i')
}
