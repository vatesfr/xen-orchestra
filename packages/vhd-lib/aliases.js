'use strict'

const { ALIAS_MAX_PATH_LENGTH } = require('./_constants')
const resolveRelativeFromFile = require('./_resolveRelativeFromFile')
const path = require('node:path')

function isVhdAlias(filename) {
  return filename.endsWith('.alias.vhd')
}
exports.isVhdAlias = isVhdAlias

exports.resolveVhdAlias = async function resolveVhdAlias(handler, filename) {
  if (!isVhdAlias(filename)) {
    return filename
  }
  if (!handler.isEncrypted) {
    const size = await handler.getSize(filename)
    if (size > ALIAS_MAX_PATH_LENGTH) {
      // seems reasonnable for a relative path
      throw new Error(`The alias file ${filename} is too big (${size} bytes)`)
    }
  }

  let aliasContent
  try {
    aliasContent = (await handler.readFile(filename)).toString().trim()
  } catch (err) {
    try {
      // try to read as a plain text
      aliasContent = (await handler._readFile(path.resolve('/', filename))).toString().trim()
      if (!aliasContent.endsWith('.vhd')) {
        throw new Error(`The alias file ${filename} is not a plaint text alias`)
      }
    } catch (plainTextErr) {
      // throw original error
      err.cause = plainTextErr
      throw err
    }
  }
  // also handle circular references and unreasonnably long chains
  if (isVhdAlias(aliasContent)) {
    throw new Error(`Chaining alias is forbidden ${filename} to ${aliasContent}`)
  }
  // the target is relative to the alias location
  return resolveRelativeFromFile(filename, aliasContent)
}
