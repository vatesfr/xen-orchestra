'use strict'

const { Constants, VhdFile } = require('vhd-lib')
const { getHandler } = require('@xen-orchestra/fs')
const { resolve } = require('path')
const UUID = require('uuid')
const humanFormat = require('human-format')
const invert = require('lodash/invert.js')

const { PLATFORMS } = Constants

const DISK_TYPES_MAP = invert(Constants.DISK_TYPES)
const PLATFORMS_MAP = invert(PLATFORMS)

const MAPPERS = {
  bytes: humanFormat.bytes,
  date: _ => (_ !== 0 ? new Date(_) : 0),
  diskType: _ => DISK_TYPES_MAP[_],
  platform: _ => PLATFORMS_MAP[_],
  uuid: UUID.stringify,
}
function mapProperties(object, mapping) {
  const result = { ...object }
  for (const prop of Object.keys(mapping)) {
    const value = object[prop]
    if (value !== undefined) {
      let mapper = mapping[prop]
      if (typeof mapper === 'string') {
        mapper = MAPPERS[mapper]
      }
      result[prop] = mapper(value)
    }
  }
  return result
}

module.exports = async function info(args) {
  const vhd = new VhdFile(getHandler({ url: 'file:///' }), resolve(args[0]))

  try {
    await vhd.readHeaderAndFooter()
  } catch (error) {
    console.warn(error)
    await vhd.readHeaderAndFooter(false)
  }

  console.log(
    mapProperties(vhd.footer, {
      currentSize: 'bytes',
      diskType: 'diskType',
      originalSize: 'bytes',
      timestamp: 'date',
      uuid: 'uuid',
    })
  )

  console.log(
    mapProperties(vhd.header, {
      blockSize: 'bytes',
      parentTimestamp: 'date',
      parentLocatorEntry: _ =>
        _.filter(_ => _.platformCode !== PLATFORMS.NONE) // hide empty
          .map(_ =>
            mapProperties(_, {
              platformCode: 'platform',
            })
          ),
      parentUuid: 'uuid',
    })
  )
}
