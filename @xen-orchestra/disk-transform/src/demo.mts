import { getSyncedHandler } from '@xen-orchestra/fs'
import { VhdRemote, RemoteMetadata } from './from/VhdRemote.mjs'
import { FileAccessor } from './file-accessor/FileAccessor.mjs'

async function run() {
  const { value: handler } = await getSyncedHandler({ url: 'file:///mnt/ssd/vhdblock' })
  const metadataPath = './xo-vm-backups/cbb46b48-12aa-59dc-4039-8a587fdc67d5/20230831T100000Z.json'

  const vhd = new VhdRemote({
    handler: handler as FileAccessor,
    metadataPath,
    diskUuid: '1282b678-cb12-4b13-ab17-7a4fdac403d8',
  })
  const { value: iterator } = await vhd.getBlockIterator()
  for await (const block of iterator) {
    console.log(block)
  }
}

run()
