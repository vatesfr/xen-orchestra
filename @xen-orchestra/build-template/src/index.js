import { escapeRegExp } from 'lodash'

const compareLengthDesc = (a, b) => b.length - a.length

export default (pattern, rules) => {
  const keys = Object.keys(rules)
  keys.push('\\')
  const matches = keys
    .sort(compareLengthDesc)
    .map(escapeRegExp)
    .join('|')
  const regExp = new RegExp(`\\\\(?:${matches})|${matches}`, 'g')
  return (...params) =>
    pattern.replace(regExp, match => {
      if (match[0] === '\\') {
        return match.slice(1)
      }
      const rule = rules[match]
      return typeof rule === 'function' ? rule(...params) : rule
    })
}
