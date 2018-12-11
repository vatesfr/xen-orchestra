import mapValues from 'lodash/mapValues'

export default function replaceSensitiveValues(value, replacement) {
  function helper(value, name) {
    if (name === 'password' && typeof value === 'string') {
      return replacement
    }

    if (typeof value !== 'object' || value === null) {
      return value
    }

    return Array.isArray(value) ? value.map(helper) : mapValues(value, helper)
  }

  return helper(value)
}
