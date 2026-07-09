'use strict'

// ===================================================================

const UnknownFormatError = require('./_unknown-format-error')

// ===================================================================

const parseJson = (function () {
  try {
    return require('json5').parse
  } catch (_) {
    /* empty */
  }

  try {
    const stripJsonComments = require('strip-json-comments')
    return function parseJson(json) {
      return JSON.parse(stripJsonComments(json))
    }
  } catch (_) {
    /* empty */
  }

  return JSON.parse
})()

// ===================================================================

const serializers = [
  {
    test: path => /\.json5?$/i.test(path),
    parse: content => parseJson(content),
  },
]

// Optional dependency.
try {
  const ini = require('ini')
  serializers.push({
    test: path => /\.ini$/i.test(path),
    parse: content => ini.decode(content),
  })
} catch (_) {
  /* empty */
}

// Optional dependency.
try {
  const { parse } = require('smol-toml')
  serializers.push({
    test: path => /\.toml$/i.test(path),
    parse: content => parse(content),
  })
} catch (_) {
  /* empty */
}

// Optional dependency.
try {
  const yaml = require('js-yaml')

  let load = yaml.load

  // compat with js-yaml < 4
  if ('DEFAULT_SAFE_SCHEMA' in yaml) {
    load = yaml.safeLoad
  }

  serializers.push({
    test: path => /\.ya?ml$/i.test(path),
    parse: content => load(content),
  })
} catch (_) {
  /* empty */
}

// ===================================================================

exports.serializers = serializers

exports.unserialize = function unserialize(file, customSerializers) {
  const all =
    customSerializers !== undefined && customSerializers.length !== 0
      ? [...customSerializers, ...serializers]
      : serializers
  const serializer = all.find(s => s.test(file.path))
  if (serializer === undefined) {
    throw new UnknownFormatError('no compatible format found for ' + file.path)
  }
  try {
    return serializer.parse(String(file.content))
  } catch (cause) {
    throw new Error('failed to parse ' + file.path, { cause })
  }
}
