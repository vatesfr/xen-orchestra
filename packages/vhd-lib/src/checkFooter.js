import assert from 'assert'

import { DISK_TYPES, FILE_FORMAT_VERSION, FOOTER_COOKIE, FOOTER_SIZE } from './_constants'

export default footer => {
  assert.strictEqual(footer.cookie, FOOTER_COOKIE)
  assert.strictEqual(footer.dataOffset, FOOTER_SIZE)
  assert.strictEqual(footer.fileFormatVersion, FILE_FORMAT_VERSION)
  assert(footer.originalSize <= footer.currentSize)
  assert(footer.diskType === DISK_TYPES.DIFFERENCING || footer.diskType === DISK_TYPES.DYNAMIC)
}
