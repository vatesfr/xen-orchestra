import execa from 'execa'
import fs from 'fs-extra'

export function suppressUnhandledRejection(p) {
  p.catch(Function.prototype)
  return p
}

export async function checkFile(vhdName) {
  // Since the qemu-img check command isn't compatible with vhd format, we use
  // the convert command to do a check by conversion. Indeed, the conversion will
  // fail if the source file isn't a proper vhd format.
  await execa('qemu-img', ['convert', '-fvpc', '-Oqcow2', vhdName, 'outputFile.qcow2'])
  await fs.rm(vhdName)
}
