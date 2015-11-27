// See: https://gist.github.com/julien-f/5b9a3537eb82a34b04e2

var matcher = require('micromatch').matcher

module.exports = function globMatcher (patterns, opts) {
  if (!Array.isArray(patterns)) {
    if (patterns[0] === '!') {
      var m = matcher(patterns.slice(1), opts)
      return function (string) {
        return !m(string)
      }
    } else {
      return matcher(patterns, opts)
    }
  }

  var noneMustMatch = []
  var anyMustMatch = []

  // TODO: could probably be optimized by combining all positive patterns (and all negative patterns) as a single matcher.
  for (var i = 0, n = patterns.length; i < n; ++i) {
    var pattern = patterns[i]
    if (pattern[0] === '!') {
      noneMustMatch.push(matcher(pattern.slice(1), opts))
    } else {
      anyMustMatch.push(matcher(pattern, opts))
    }
  }

  var nNone = noneMustMatch.length
  var nAny = anyMustMatch.length

  return function (string) {
    var i

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
