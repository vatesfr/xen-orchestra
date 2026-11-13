// Runs against a real array when EVERPURE_URL, EVERPURE_API_TOKEN and
// EVERPURE_VOLUME are set (EVERPURE_ALLOW_UNAUTHORIZED=1 for a self-signed
// certificate). Creates and deletes two snapshots of EVERPURE_VOLUME.
import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'

import { EverpureClient, type EverpureVolumeSnapshot } from './EverpureClient.mjs'

const { EVERPURE_URL, EVERPURE_API_TOKEN, EVERPURE_VOLUME, EVERPURE_ALLOW_UNAUTHORIZED } = process.env
const configured = EVERPURE_URL !== undefined && EVERPURE_API_TOKEN !== undefined && EVERPURE_VOLUME !== undefined

const BLOCK_SIZE = 2 ** 21

describe(
  'EverpureClient against a real array',
  { skip: !configured && 'EVERPURE_URL, EVERPURE_API_TOKEN and EVERPURE_VOLUME are not set' },
  () => {
    const client = new EverpureClient({
      url: EVERPURE_URL ?? '',
      apiToken: EVERPURE_API_TOKEN ?? '',
      allowUnauthorized: EVERPURE_ALLOW_UNAUTHORIZED === '1',
    })
    const volume = EVERPURE_VOLUME ?? ''
    const created: EverpureVolumeSnapshot[] = []

    before(() => client.connect())
    after(async () => {
      for (const snapshot of created) {
        await client.deleteVolumeSnapshot(snapshot.name)
      }
      await client.close()
    })

    it('creates, lists, diffs and deletes snapshots', async () => {
      const stamp = Date.now()
      const first = await client.createVolumeSnapshot(volume, { suffix: `xo-integ-${stamp}-a` })
      created.push(first)
      assert.equal(first.source.name, volume)

      const listed: string[] = []
      for await (const snapshot of client.listVolumeSnapshots(volume)) {
        listed.push(snapshot.name)
      }
      assert.ok(listed.includes(first.name))

      // allocated blocks: no base
      let allocatedBytes = 0
      let count = 0
      let previousEnd = -1
      for await (const { offset, length } of client.listChangedBlocks({ name: first.name, blockSize: BLOCK_SIZE })) {
        assert.equal(offset % BLOCK_SIZE, 0, 'ranges are aligned on the block size')
        assert.ok(length > 0)
        assert.ok(offset >= previousEnd, 'ranges are sorted and disjoint')
        assert.ok(offset + length <= first.provisioned)
        previousEnd = offset + length
        allocatedBytes += length
        count++
      }
      console.log(`${first.name}: ${count} allocated ranges, ${allocatedBytes} bytes of ${first.provisioned}`)

      // changed blocks between two snapshots
      const second = await client.createVolumeSnapshot(volume, { suffix: `xo-integ-${stamp}-b` })
      created.push(second)
      let changedBytes = 0
      for await (const { offset, length } of client.listChangedBlocks({
        name: second.name,
        baseName: first.name,
        blockSize: BLOCK_SIZE,
      })) {
        assert.equal(offset % BLOCK_SIZE, 0)
        changedBytes += length
      }
      console.log(`${second.name} vs ${first.name}: ${changedBytes} bytes changed`)
      assert.ok(changedBytes <= first.provisioned)

      const result = await client.deleteVolumeSnapshot(second.name)
      created.pop()
      console.log(`${second.name} deleted, eradicated: ${result.eradicated}`)
    })
  }
)
