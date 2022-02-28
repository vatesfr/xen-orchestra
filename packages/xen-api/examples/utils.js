'use strict'

const { createReadStream, createWriteStream, statSync } = require('fs')
const { fromCallback } = require('promise-toolbox')
const { PassThrough, pipeline } = require('readable-stream')
const humanFormat = require('human-format')
const Throttle = require('throttle')

const Ref = require('../dist/_Ref').default

exports.createInputStream = path => {
  if (path === undefined || path === '-') {
    return process.stdin
  }

  const { size } = statSync(path)

  const stream = createReadStream(path)
  stream.length = size
  return stream
}

exports.createOutputStream = path => {
  if (path !== undefined && path !== '-') {
    return createWriteStream(path)
  }

  // introduce a through stream because stdout is not a normal stream!
  const stream = new PassThrough()
  stream.pipe(process.stdout)
  return stream
}

const formatSizeOpts = { scale: 'binary', unit: 'B' }
const formatSize = bytes => humanFormat(bytes, formatSizeOpts)

exports.formatProgress = p =>
  [
    formatSize(p.transferred),
    ' / ',
    formatSize(p.length),
    ' | ',
    p.runtime,
    's / ',
    p.eta,
    's | ',
    formatSize(p.speed),
    '/s',
  ].join('')

exports.pipeline = (...streams) => {
  return fromCallback(cb => {
    streams = streams.filter(_ => _ != null)
    streams.push(cb)
    pipeline.apply(undefined, streams)
  })
}

const resolveRef = (xapi, type, refOrUuidOrNameLabel) =>
  Ref.is(refOrUuidOrNameLabel)
    ? refOrUuidOrNameLabel
    : xapi.call(`${type}.get_by_uuid`, refOrUuidOrNameLabel).catch(() =>
        xapi.call(`${type}.get_by_name_label`, refOrUuidOrNameLabel).then(refs => {
          if (refs.length === 1) {
            return refs[0]
          }
          throw new Error(`no single match for ${type} with name label ${refOrUuidOrNameLabel}`)
        })
      )

exports.resolveRecord = async (xapi, type, refOrUuidOrNameLabel) =>
  xapi.getRecord(type, await resolveRef(xapi, type, refOrUuidOrNameLabel))

exports.resolveRef = resolveRef

exports.throttle = opts => (opts != null ? new Throttle(opts) : undefined)
