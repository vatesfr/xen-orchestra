'use strict'

const { Constants } = require('vhd-lib')
const { getSyncedHandler } = require('@xen-orchestra/fs')
const { openVhd } = require('vhd-lib/openVhd')
const Disposable = require('promise-toolbox/Disposable')
const humanFormat = require('human-format')
const invert = require('lodash/invert.js')
const UUID = require('uuid')

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

async function showDetails(handler, path) {
  await Disposable.use(openVhd(handler, path), async vhd => {
    try {
      await vhd.readHeaderAndFooter()
    } catch (error) {
      console.warn(error)
      await vhd.readHeaderAndFooter(false)
    }

    console.log(
      'footer:',
      mapProperties(vhd.footer, {
        currentSize: 'bytes',
        diskType: 'diskType',
        originalSize: 'bytes',
        timestamp: 'date',
        uuid: 'uuid',
      })
    )

    console.log(
      'header:',
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
  })
}

async function showList(handler, paths) {
  let previousUuid
  for (const path of paths) {
    await Disposable.use(openVhd(handler, path), async vhd => {
      const uuid = MAPPERS.uuid(vhd.footer.uuid)
      const fields = [path, MAPPERS.bytes(vhd.footer.currentSize), uuid, MAPPERS.diskType(vhd.footer.diskType)]
      if (vhd.footer.diskType === Constants.DISK_TYPES.DIFFERENCING) {
        const parentUuid = MAPPERS.uuid(vhd.header.parentUuid)
        fields.push(parentUuid === previousUuid ? '<above VHD>' : parentUuid)
      }
      previousUuid = uuid
      console.log(fields.join(' | '))
    })
  }
}

module.exports = async function info(args) {
  if (args.length < 2 || args.some(_ => _ === '-h' || _ === '--help')) {
    return `Displays infos on one or more VHDs.
    Usage: ${this.command} <remote URL> <VHD path on remote> <another VHD path (optional)> ...`
  }
  const unexpectedArgs = args.filter(arg => arg.startsWith('-'))
  if (unexpectedArgs.length > 0) {
    return `Option${unexpectedArgs.length > 1 ? 's' : ''} ${unexpectedArgs} unsupported, use --help for details.`
  }

  await Disposable.use(getSyncedHandler({ url: args.shift() }), async handler => {
    if (args.length === 1) {
      return showDetails(handler, args[0])
    }

    return showList(handler, args)
  })
}
