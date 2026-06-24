import { isNotEmptyRef } from './_isNotEmptyRef.mjs'
import { importVm } from './importVm.mjs'

export async function importDisk(vdi, disk, sr) {
  // create a fake VM
  const xapi = sr.$xapi
  const vmRef = await importVm(
    {
      name_label: `[xva-disk-import]${vdi.name_label}`,
      memory: 1024 * 1024 * 32,
      nCpus: 1,
      firmware: 'bios',
      vdis: [vdi],
      disks: [disk],
    },
    sr
  )
  try {
    // wait for the VM to be loaded if necessary
    xapi.getObject(vmRef, undefined) ?? (await xapi.waitObject(vmRef))

    const vbdRefs = await xapi.getField('VM', vmRef, 'VBDs')
    // get the disk
    const disks = { __proto__: null }
    ;(await xapi.getRecords('VBD', vbdRefs)).forEach(vbd => {
      if (vbd.type === 'Disk' && isNotEmptyRef(vbd.VDI)) {
        disks[vbd.VDI] = true
      }
    })
    return await xapi.getRecord('VDI', Object.keys(disks)[0])
  } finally {
    // destroy what is remaining of the VM
    await xapi.call('VM.destroy', vmRef)
  }
}
