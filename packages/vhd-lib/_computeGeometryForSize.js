'use strict'

const { SECTOR_SIZE } = require('./_constants')

module.exports = function computeGeometryForSize(size) {
  const totalSectors = Math.min(Math.ceil(size / 512), 65535 * 16 * 255)
  let sectorsPerTrackCylinder
  let heads
  let cylinderTimesHeads
  // straight copypasta from the file spec appendix on CHS Calculation
  if (totalSectors >= 65535 * 16 * 63) {
    sectorsPerTrackCylinder = 255
    heads = 16
    cylinderTimesHeads = totalSectors / sectorsPerTrackCylinder
  } else {
    sectorsPerTrackCylinder = 17
    cylinderTimesHeads = totalSectors / sectorsPerTrackCylinder
    heads = Math.floor((cylinderTimesHeads + 1023) / 1024)
    if (heads < 4) {
      heads = 4
    }
    if (cylinderTimesHeads >= heads * 1024 || heads > 16) {
      sectorsPerTrackCylinder = 31
      heads = 16
      cylinderTimesHeads = totalSectors / sectorsPerTrackCylinder
    }
    if (cylinderTimesHeads >= heads * 1024) {
      sectorsPerTrackCylinder = 63
      heads = 16
      cylinderTimesHeads = totalSectors / sectorsPerTrackCylinder
    }
  }
  const cylinders = Math.ceil(cylinderTimesHeads / heads)
  const actualSize = cylinders * heads * sectorsPerTrackCylinder * SECTOR_SIZE
  return { cylinders, heads, sectorsPerTrackCylinder, actualSize }
}
