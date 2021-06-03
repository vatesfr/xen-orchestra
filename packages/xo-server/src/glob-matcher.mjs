// See: https://gist.github.com/julien-f/5b9a3537eb82a34b04e2

import micromatch from 'micromatch'

const { matcher } = micromatch

export default function globMatcher(patterns, opts) {
  if (!Array.isArray(patterns)) {
    if (patterns[0] === '!') {
      const m = matcher(patterns.slice(1), opts)
      return function (string) {
        return !m(string)
      }
    } else {
      return matcher(patterns, opts)
    }
  }

  const noneMustMatch = []
  const anyMustMatch = []

  // TODO: could probably be optimized by combining all positive patterns (and all negative patterns) as a single matcher.
  for (let i = 0, n = patterns.length; i < n; ++i) {
    const pattern = patterns[i]
    if (pattern[0] === '!') {
      noneMustMatch.push(matcher(pattern.slice(1), opts))
    } else {
      anyMustMatch.push(matcher(pattern, opts))
    }
  }

  const nNone = noneMustMatch.length
  const nAny = anyMustMatch.length

  return function (string) {
    if (typeof string !== 'string') {
      return false
    }

    let i

    for (i = 0; i < nNone; ++i) {
      if (noneMustMatch[i](string)) {
        return false
      }
    }

    if (nAny === 0) {
      return true
    }

    for (i = 0; i < nAny; ++i) {
      if (anyMustMatch[i](string)) {
        return true
      }
    }

    return false
  }
}
