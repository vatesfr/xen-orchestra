import { describe, it } from 'node:test'
import { strict as assert } from 'assert'
import { getHandler } from '.'

import { tmpdir } from 'os'
describe('work please',async  function () {
    const handler  = getHandler({ url:`file://${tmpdir()}/xo-fs-tests-${Date.now()}?useVhdDirectory=true` })
    await handler.sync()

    const paths = [
        '/xo-vm-backups/1/vdis/2/3/data/4.vhd/blocks/one',
        '/xo-vm-backups/1/vdis/2/3/data/4.vhd/blocks/two',
        '/xo-vm-backups/1/vdis/2/3/data/4.vhd/blocks/three'
    ]
    await Promise.all(paths.map(path=>handler.fileStore.write(path, "content")))
    console.log('retrives hash', await handler.fileStore._retrieveHash(paths[2], 'user.hash.sha256'))


    let stat = await handler.stat(paths[0])
    assert.strictEqual(stat.nlink, 4) // source + 3 copy

    await handler.fileStore.remove(paths[1])
    stat = await handler.stat(paths[0])
    assert.strictEqual(stat.nlink, 3) // source + 2 copy

    await handler.fileStore.move(paths[0], '/xo-vm-backups/1/vdis/2/3/data/4.vhd/blocks/four')
    stat = await handler.stat('/xo-vm-backups/1/vdis/2/3/data/4.vhd/blocks/four')
    assert.strictEqual(stat.nlink, 3) // source + 2 copy


    await handler.fileStore.remove(paths[2])
    await handler.fileStore.remove('/xo-vm-backups/1/vdis/2/3/data/4.vhd/blocks/four')

  })
  