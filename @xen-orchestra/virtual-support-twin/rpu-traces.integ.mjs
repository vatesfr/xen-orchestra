import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { join } from 'node:path'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { createRpuTracesWriter } from './rpu-traces.mjs'

const FILE = 'rpu-11111111-1111-1111-1111-111111111111-20261110T123456789Z.ndjson'

async function withDir(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'rpu-traces-'))
  try {
    await fn(join(dir, 'rpu-traces'))
  } finally {
    await rm(dir, { recursive: true })
  }
}

describe('createRpuTracesWriter()', () => {
  it('rebuilds the files, keeping the truncated lines as is', () =>
    withDir(async dir => {
      const writer = createRpuTracesWriter(dir)
      await writer.write({ file: FILE, data: { type: 'start' } })
      await writer.write({ file: FILE, raw: '{"type":"info","mess' })
      await writer.write({ file: FILE.replace('.ndjson', '.heartbeat.json'), data: { status: 'pending' } })
      await writer.close()

      assert.equal(writer.files, 2)
      assert.deepEqual((await readdir(dir)).sort(), [FILE.replace('.ndjson', '.heartbeat.json'), FILE])
      assert.equal(await readFile(join(dir, FILE), 'utf8'), '{"type":"start"}\n{"type":"info","mess\n')
    }))

  it('refuses to overwrite an existing file', () =>
    withDir(async dir => {
      const first = createRpuTracesWriter(dir)
      await first.write({ file: FILE, data: {} })
      await first.close()

      const second = createRpuTracesWriter(dir)
      await assert.rejects(second.write({ file: FILE, data: {} }), { code: 'EEXIST' })
      await second.close()
    }))

  it('refuses names which are not traces', () =>
    withDir(async dir => {
      const writer = createRpuTracesWriter(dir)
      for (const file of ['../rpu-x.ndjson', 'rpu-x/../../y.ndjson', 'leveldb', '.ndjson']) {
        await assert.rejects(writer.write({ file, data: {} }), /invalid RPU trace file name/)
      }
    }))
})
