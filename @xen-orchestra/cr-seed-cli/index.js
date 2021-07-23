#!/usr/bin/env node

const { Ref, Xapi } = require('xen-api')
const { defer } = require('golike-defer')

const pkg = require('./package.json')

Xapi.prototype.getVmDisks = async function (vm) {
  const disks = { __proto__: null }
  await Promise.all([
    ...vm.VBDs.map(async vbdRef => {
      const vbd = await this.getRecord('VBD', vbdRef)
      let vdiRef
      if (vbd.type === 'Disk' && Ref.isNotEmpty((vdiRef = vbd.VDI))) {
        disks[vbd.userdevice] = await this.getRecord('VDI', vdiRef)
      }
    }),
  ])
  return disks
}

defer(async function main($defer, args) {
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    const cliName = Object.keys(pkg.bin)[0]
    return console.error(
      '%s',
      `
Usage: ${cliName} <source XAPI URL> <source snapshot UUID> <target XAPI URL> <target VM UUID> <backup job id> <backup schedule id>

${cliName} v${pkg.version}
`
    )
  }

  const [srcXapiUrl, srcSnapshotUuid, tgtXapiUrl, tgtVmUuid, jobId, scheduleId] = args

  const srcXapi = new Xapi({
    allowUnauthorized: true,
    url: srcXapiUrl,
    watchEvents: false,
  })
  await srcXapi.connect()
  defer.call(srcXapi, 'disconnect')

  const tgtXapi = new Xapi({
    allowUnauthorized: true,
    url: tgtXapiUrl,
    watchEvents: false,
  })
  await tgtXapi.connect()
  defer.call(tgtXapi, 'disconnect')

  const [srcSnapshot, tgtVm] = await Promise.all([
    srcXapi.getRecordByUuid('VM', srcSnapshotUuid),
    tgtXapi.getRecordByUuid('VM', tgtVmUuid),
  ])
  const srcVm = await srcXapi.getRecord('VM', srcSnapshot.snapshot_of)

  const metadata = {
    'xo:backup:datetime': srcSnapshot.snapshot_time,
    'xo:backup:job': jobId,
    'xo:backup:schedule': scheduleId,
    'xo:backup:vm': srcVm.uuid,
  }

  const [srcDisks, tgtDisks] = await Promise.all([srcXapi.getVmDisks(srcSnapshot), tgtXapi.getVmDisks(tgtVm)])
  const userDevices = Object.keys(tgtDisks)

  const tgtSr = await tgtXapi.getRecord('SR', tgtDisks[Object.keys(tgtDisks)[0]].SR)

  await Promise.all([
    srcSnapshot.update_other_config(metadata),
    srcSnapshot.update_other_config('xo:backup:exported', 'true'),
    tgtVm.set_name_label(`${srcVm.name_label} (${srcSnapshot.snapshot_time})`),
    tgtVm.update_other_config(metadata),
    tgtVm.update_other_config({
      'xo:backup:sr': tgtSr.uuid,
      'xo:copy_of': srcSnapshotUuid,
    }),
    Promise.all(
      ['start', 'start_on'].map(op =>
        tgtVm.update_blocked_operations(op, 'Start operation for this vm is blocked, clone it if you want to use it.')
      )
    ),
    Promise.all(
      userDevices.map(userDevice => {
        const srcDisk = srcDisks[userDevice]
        const tgtDisk = tgtDisks[userDevice]

        return tgtDisk.update_other_config({
          'xo:copy_of': srcDisk.uuid,
        })
      })
    ),
  ])
})(process.argv.slice(2)).catch(console.error.bind(console, 'Fatal error:'))
