// @ts-check

/**
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 */

/**
 * a block read as stored in a VHD directory (bitmap and data compressed together, see
 * VhdDirectory#readCompressedBlock), it can only be written as is in a VHD directory using the same compression
 * @typedef {DiskBlock & { compression: string }} CompressedDiskBlock
 */

/**
 * @param {DiskBlock | CompressedDiskBlock} block
 * @returns {block is CompressedDiskBlock}
 */
export function isCompressedBlock(block) {
  return 'compression' in block && block.compression !== undefined
}
