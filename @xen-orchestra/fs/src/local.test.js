import { after, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs/promises'
import { getSyncedHandler } from './index.js'
import { Disposable, pFromCallback } from 'promise-toolbox'
import tmp from 'tmp'
import execa from 'execa'
import { rimraf } from 'rimraf'
import { randomBytes } from 'node:crypto'

// https://xkcd.com/221/
const data =
  'H2GbLa0F2J4LHFLRwLP9zN4dGWJpdx1T6eGWra8BRlV9fBpRGtWIOSKXjU8y7fnxAWVGWpbYPYCwRigvxRSTcuaQsCtwvDNKMmFwYpsGMS14akgBD3EpOMPpKIRRySOsOeknpr48oopO1n9eq0PxGbOcY4Q9aojRu9rn1SMNyjq7YGzwVQEm6twA3etKGSYGvPJVTs2riXm7u6BhBh9VZtQDxQEy5ttkHiZUpgLi6QshSpMjL7dHco8k6gzGcxfpoyS5IzaQeXqDOeRjE6HNn27oUXpze5xRYolQhxA7IqdfzcYwWTqlaZb7UBUZoFCiFs5Y6vPlQVZ2Aw5YganLV1ZcIz78j6TAtXJAfXrDhksm9UteQul8RYT0Ur8AJRYgiGXOsXrWWBKm3CzZci6paLZ2jBmGfgVuBJHlvgFIjOHiVozjulGD4SwKQ2MNqUOylv89NTP1BsJuZ7MC6YCm5yix7FswoE7Y2NhDFqzEQvseRQFyz52AsfuqRY7NruKHlO7LOSI932che2WzxBAwy78Sk1eRHQLsZ37dLB4UkFFIq6TvyjJKznTMAcx9HDOSrFeke6KfsDB1A4W3BAxJk40oAcFMeM72Lg97sJExMJRz1m1nGQJEiGCcnll9G6PqEfHjoOhdDLgN2xewUyvbuRuKEXXxD1H6Tz1iWReyRGSagQNLXvqkKoHoxu3bvSi8nWrbtEY6K2eHLeF5bYubYGXc5VsfiCQNPEzQV4ECzaPdolRtbpRFMcB5aWK70Oew3HJkEcN7IkcXI9vlJKnFvFMqGOHKujd4Tyjhvru2UFh0dAkEwojNzz7W0XlASiXRneea9FgiJNLcrXNtBkvIgw6kRrgbXI6DPJdWDpm3fmWS8EpOICH3aTiXRLQUDZsReAaOsfau1FNtP4JKTQpG3b9rKkO5G7vZEWqTi69mtPGWmyOU47WL1ifJtlzGiFbZ30pcHMc0u4uopHwEQq6ZwM5S6NHvioxihhHQHO8JU2xvcjg5OcTEsXtMwIapD3re'
const hash = '09a3cd9e135114cb870a0b5cf0dfd3f4be994662d0c715b65bcfc5e3b635dd40'
const dataPath = 'xo-block-store/09a3/cd9e/1351/14cb/870a/0b5c/f0df/d3f4/be99/4662/d0c7/15b6/5bcf/c5e3/b635/dd40.source'

let dir
describe('dedup tests', () => {
  beforeEach(async () => {
    dir = await pFromCallback(cb => tmp.dir(cb))
  })
  after(async () => {
    await rimraf(dir)
  })

  it('works in general case ', async () => {
    await Disposable.use(getSyncedHandler({ url: `file://${dir}` }, { dedup: true }), async handler => {
      await handler.outputFile('in/a/sub/folder/file', data, { dedup: true })
      assert.doesNotReject(handler.list('xo-block-store'))
      assert.strictEqual((await handler.list('xo-block-store')).length, 1)
      assert.strictEqual((await handler.list('in/a/sub/folder')).length, 1)
      assert.strictEqual((await handler.readFile('in/a/sub/folder/file')).toString('utf-8'), data)
      const value = (await execa('getfattr', ['-n', 'user.hash.sha256', '--only-value', dir + '/in/a/sub/folder/file']))
        .stdout
      assert.strictEqual(value, hash)
      // the source file is created
      assert.strictEqual((await handler.readFile(dataPath)).toString('utf-8'), data)

      await handler.outputFile('in/anotherfolder/file', data, { dedup: true })
      assert.strictEqual((await handler.list('in/anotherfolder')).length, 1)
      assert.strictEqual((await handler.readFile('in/anotherfolder/file')).toString('utf-8'), data)

      await handler.unlink('in/a/sub/folder/file', { dedup: true })
      // source is still here
      assert.strictEqual((await handler.readFile(dataPath)).toString('utf-8'), data)
      assert.strictEqual((await handler.readFile('in/anotherfolder/file')).toString('utf-8'), data)

      await handler.unlink('in/anotherfolder/file', { dedup: true })
      // source should have been deleted
      assert.strictEqual(
        (
          await handler.list(
            'xo-block-store/09a3/cd9e/1351/14cb/870a/0b5c/f0df/d3f4/be99/4662/d0c7/15b6/5bcf/c5e3/b635'
          )
        ).length,
        0
      )
      assert.strictEqual((await handler.list('in/anotherfolder')).length, 0)
    })
  })

  it('garbage collector an stats ', async () => {
    await Disposable.use(getSyncedHandler({ url: `file://${dir}` }, { dedup: true }), async handler => {
      await handler.outputFile('in/anotherfolder/file', data, { dedup: true })
      await handler.outputFile('in/anotherfolder/same', data, { dedup: true })
      await handler.outputFile('in/a/sub/folder/file', randomBytes(1024), { dedup: true })

      let stats = await handler.deduplicationStats()
      assert.strictEqual(stats.nbBlocks, 3)
      assert.strictEqual(stats.nbSourceBlocks, 2)

      await fs.unlink(`${dir}/in/a/sub/folder/file`, { dedup: true })
      assert.strictEqual((await handler.list('xo-block-store')).length, 2)

      await handler.deduplicationGarbageCollector()
      stats = await handler.deduplicationStats()
      assert.strictEqual(stats.nbBlocks, 2)
      assert.strictEqual(stats.nbSourceBlocks, 1)

      assert.strictEqual((await handler.list('xo-block-store')).length, 1)
    })
  })

  it('compute support', async () => {
    await Disposable.use(getSyncedHandler({ url: `file://${dir}` }, { dedup: true }), async handler => {
      const supported = await handler.checkSupport()
      assert.strictEqual(supported.hardLink, true, 'support hard link is not present in local fs')
      assert.strictEqual(supported.extendedAttributes, true, 'support extended attributes is not present in local fs')
    })
  })

  it('handles edge cases : source deleted', async () => {
    await Disposable.use(getSyncedHandler({ url: `file://${dir}` }, { dedup: true }), async handler => {
      await handler.outputFile('in/a/sub/folder/edge', data, { dedup: true })
      await handler.unlink(dataPath, { dedup: true })
      // no error if source si already deleted
      await assert.doesNotReject(() => handler.unlink('in/a/sub/folder/edge', { dedup: true }))
    })
  })
  it('handles edge cases : non deduplicated file ', async () => {
    await Disposable.use(getSyncedHandler({ url: `file://${dir}` }, { dedup: true }), async handler => {
      await handler.outputFile('in/a/sub/folder/edge', data, { dedup: false })
      // no error if deleting a non dedup file with dedup flags
      await assert.doesNotReject(() => handler.unlink('in/a/sub/folder/edge', { dedup: true }))
    })
  })
})
