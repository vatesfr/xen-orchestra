import { isNotEmptyRef } from './_isNotEmptyRef.mjs'
import { importVm } from './importVm.mjs'

export async function importVdi(vdi, rawStream, xapi, sr) {
  // create a fake VM
  const vmRef = await importVm(
    {
      name_label: `[xva-disp-import]${vdi.name_label}`,
      memory: 1024 * 1024 * 32,
      nCpus: 1,
      firmware: 'bios',
      vdis: [vdi],
      streams: [rawStream],
    },
    xapi,
    sr
  )
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
  // destroy the VM and VBD
  await xapi.call('VM.destroy', vmRef)
  return await xapi.getRecord('VDI', Object.keys(disks)[0])
}
