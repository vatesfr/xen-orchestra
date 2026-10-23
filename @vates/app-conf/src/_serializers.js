'use strict'

// ===================================================================

const UnknownFormatError = require('./_unknown-format-error')

// ===================================================================

const ini = require('ini')
const json5 = require('json5')
const toml = require('smol-toml')
const yaml = require('js-yaml')

// ===================================================================

const serializers = [
  {
    test: path => /\.json5?$/i.test(path),
    parse: content => json5.parse(content),
  },
  {
    test: path => /\.ini$/i.test(path),
    parse: content => ini.decode(content),
  },
  {
    test: path => /\.toml$/i.test(path),
    parse: content => toml.parse(content),
  },
  {
    test: path => /\.ya?ml$/i.test(path),
    parse: content => yaml.load(content),
  },
]

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
