'use strict'

const { BrokenVhdError } = require('.')
const { resolveVhdAlias } = require('./aliases')
const { VhdDirectory } = require('./Vhd/VhdDirectory.js')
const { VhdFile } = require('./Vhd/VhdFile.js')

class AggregateError extends Error {
  constructor(errors, message) {
    super(message)
    this.errors = errors
  }
}

exports.openVhd = async function openVhd(handler, path, opts) {
  const resolved = await resolveVhdAlias(handler, path)
  try {
    return await VhdDirectory.open(handler, resolved, opts)
  } catch (vhdDirectoryError) {
    // it's a directory, but it's an invalid vhd
    if (vhdDirectoryError instanceof BrokenVhdError) {
      throw vhdDirectoryError
    }

    // it's not a vhd directory, try to open it as a vhd file
    try {
      return await VhdFile.open(handler, resolved, opts)
    } catch (vhdFileError) {
      // this is really a file that looks like a vhd but is broken
      if (vhdFileError instanceof BrokenVhdError) {
        throw vhdFileError
      }
      // the errors are not vhd related, throw both error to keep a trace
      throw new AggregateError([vhdDirectoryError, vhdFileError])
    }
  }
}
