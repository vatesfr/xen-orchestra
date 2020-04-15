import assert from 'assert'
import ofHeader from './header'
import of from '../openflow-11'

// =============================================================================

const ERROR_CODE = {
  [of.errorType.helloFailed]: of.helloFailedCode,
  [of.errorType.badRequest]: of.badRequestCode,
  [of.errorType.badAction]: of.badActionCode,
  [of.errorType.badInstruction]: of.badInstructionCode,
  [of.errorType.badMatch]: of.badMatchCode,
  [of.errorType.flowModFailed]: of.flowModFailedCode,
  [of.errorType.groupModFailed]: of.groupModFailedCode,
  [of.errorType.portModFailed]: of.portModFailedCode,
  [of.errorType.tableModFailed]: of.tableModFailedCode,
  [of.errorType.queueOpFailed]: of.queueOpFailedCode,
  [of.errorType.switchConfigFailed]: of.switchConfigFailedCode,
}

// -----------------------------------------------------------------------------

const OFFSETS = of.offsets.errorMsg

// =============================================================================

export default {
  fromJson: (object, buffer = undefined, offset = 0) => {
    const { header, type, code, data } = object
    assert(header.type === of.type.error)
    assert(Object.keys(ERROR_CODE).includes(String(type)))
    assert(Object.values(ERROR_CODE[type]).includes(code))

    object.length = of.sizes.errorMsg
    if (data !== undefined) {
      object.length += data.length
    }

    buffer = buffer !== undefined ? buffer : Buffer.alloc(object.length)

    ofHeader.fromJson(header, buffer, offset + OFFSETS.header)
    buffer.writeUInt16BE(type, offset + OFFSETS.type)
    buffer.writeUInt16BE(code, offset + OFFSETS.code)

    if (data !== undefined) {
      data.copy(buffer, offset + OFFSETS.data, 0, data.length)
    }

    return buffer
  },

  toJson: (buffer, offset = 0) => {
    const header = ofHeader.toJson(buffer, offset + OFFSETS.header)
    assert(header.type === of.type.error)

    const type = buffer.readUInt16BE(offset + OFFSETS.type)
    assert(Object.keys(ERROR_CODE).includes(String(type)))

    const code = buffer.readUInt16BE(offset + OFFSETS.code)
    assert(Object.values(ERROR_CODE[type]).includes(code))

    const object = { header, type, code }
    const dataSize = header.length - of.sizes.errorMsg
    if (dataSize > 0) {
      object.data = Buffer.alloc(dataSize)
      buffer.copy(
        object.data,
        0,
        offset + OFFSETS.data,
        offset + OFFSETS.data + dataSize
      )
    }

    return object
  },
}
