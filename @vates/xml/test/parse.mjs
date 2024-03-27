import { parse } from '@vates/xml/parse.mjs'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'test'

test(async function () {
  const [xml, tree] = await Promise.all([
    readFile(new URL('data.xml', import.meta.url)),
    readFile(new URL('data.json', import.meta.url)).then(JSON.parse),
  ])

  assert.deepEqual(parse(xml), tree)
})
