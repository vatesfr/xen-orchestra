import tar from 'tar-stream'

import writeOvaXml from './_writeOvaXml.mjs'
import writeDisk from './_writeDisk.mjs'
import writeVhd from './_writeVhd.mjs'

/**
 * write a full XVA (ova.xml + the content of each disk) in a tar pack
 *
 * each disk must be initialized, non differencing, and will be closed once written
 *
 * @param {import('tar-stream').Pack} pack
 * @param {object} vm VM record fields, plus:
 * @param {number} vm.memory
 * @param {number} vm.nCpus
 * @param {'bios'|'uefi'} vm.firmware
 * @param {object[]} vm.vdis VDI metadata, one per disk, in the same order
 * @param {import('@xen-orchestra/disk-transform').Disk[]} [vm.disks] one per VDI
 * @param {object[]} [vm.vhds] legacy, vhd-lib VHD, they are placed before the disks
 * @param {Array<{macAddress:string, isGenerated:boolean}>} [vm.networks]
 * @param {object} [opts]
 * @param {object} [opts.sr] SR record, only used to describe the SR in ova.xml
 * @param {object} [opts.network] network record, needed to create the VIFs
 */
export async function writeXva(pack, vm, { sr, network } = {}) {
  const { vhds = [], disks = [] } = vm
  const writtenVdis = await writeOvaXml(pack, vm, { sr, network })
  for (let i = 0; i < vhds.length; i++) {
    await writeVhd(pack, vhds[i], writtenVdis[i].ref)
  }
  for (let i = 0; i < disks.length; i++) {
    const { ref, virtualSize } = writtenVdis[vhds.length + i]
    await writeDisk(pack, disks[i], { basePath: ref, virtualSize })
  }
  pack.finalize()
}

/**
 * same as writeXva, but returns a readable stream of the XVA
 *
 * errors are forwarded to the stream
 *
 * @returns {import('tar-stream').Pack}
 */
export function toXvaStream(vm, opts) {
  const pack = tar.pack()
  writeXva(pack, vm, opts).catch(error => pack.destroy(error))
  return pack
}
