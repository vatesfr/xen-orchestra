import { getSyncedHandler } from '@xen-orchestra/fs'
import { VhdRemote } from './from/VhdRemote.mts'
import { FileAccessor } from './file-accessor/FileAccessor.mts'
import { writeVhdFileToRemote } from './to/VhdRemote.mts'

async function run() {
  const { value: handlerSource } = await getSyncedHandler({ url: 'file:///mnt/ssd/vhdblock' })
  const { value: handlerTarget } = await getSyncedHandler({ url: 'file:///mnt/ssd/out' })
  const metadataPath = './xo-vm-backups/cbb46b48-12aa-59dc-4039-8a587fdc67d5/20230831T100000Z.json'

  const vhd = new VhdRemote({
    handler: handlerSource as FileAccessor,
    metadataPath,
    diskUuid: '1282b678-cb12-4b13-ab17-7a4fdac403d8',
  })

  await writeVhdFileToRemote(handlerTarget, 'out.vhd', vhd)
}

run()
