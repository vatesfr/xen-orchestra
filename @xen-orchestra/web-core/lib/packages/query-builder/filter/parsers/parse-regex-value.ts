import { RegExpNode } from 'complex-matcher'

export function parseRegexValue(value: string = '') {
  const regexMatch = value.match(/^\/(.*)\/([gimsuy]*)$/)

  if (regexMatch) {
    const pattern = regexMatch[1]
    const flags = regexMatch[2]
    return new RegExpNode(pattern, flags).toString()
  }

  return new RegExpNode(value).toString()
}
