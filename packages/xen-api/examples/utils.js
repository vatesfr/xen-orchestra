const { createReadStream, createWriteStream, statSync } = require('fs')
const { PassThrough } = require('stream')

const { isOpaqueRef } = require('../')

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

exports.resolveRef = (xapi, type, refOrUuidOrNameLabel) =>
  isOpaqueRef(refOrUuidOrNameLabel)
    ? refOrUuidOrNameLabel
    : xapi.call(`${type}.get_by_uuid`, refOrUuidOrNameLabel).catch(
      () => xapi.call(`${type}.get_by_name_label`, refOrUuidOrNameLabel).then(
        refs => {
          if (refs.length === 1) {
            return refs[0]
          }
          throw new Error(`no single match for ${type} with name label ${refOrUuidOrNameLabel}`)
        }
      )
    )
