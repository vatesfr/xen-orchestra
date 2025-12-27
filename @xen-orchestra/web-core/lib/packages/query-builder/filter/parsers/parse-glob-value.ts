import { GlobPattern as GlobPatternNode } from 'complex-matcher'

export function parseGlobValue(value: string = '') {
  return new GlobPatternNode(value).toString().replace(/\s+/g, '*')
}
