import { createReadStream, createWriteStream, statSync } from 'fs'
import { fromCallback } from 'promise-toolbox'
import { PassThrough, pipeline as Pipeline } from 'readable-stream'
import humanFormat from 'human-format'
import Throttle from 'throttle'

import Ref from '../_Ref.mjs'

export function createInputStream(path) {
  if (path === undefined || path === '-') {
    return process.stdin
  }

  const { size } = statSync(path)

  const stream = createReadStream(path)
  stream.length = size
  return stream
}

export function createOutputStream(path) {
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

export function formatProgress(p) {
  return [
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
}

export function pipeline(...streams) {
  return fromCallback(cb => {
    streams = streams.filter(_ => _ != null)
    streams.push(cb)
    Pipeline.apply(undefined, streams)
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

export async function resolveRecord(xapi, type, refOrUuidOrNameLabel) {
  return xapi.getRecord(type, await resolveRef(xapi, type, refOrUuidOrNameLabel))
}

export { resolveRef }

export function throttle(opts) {
  return opts != null ? new Throttle(opts) : undefined
}
