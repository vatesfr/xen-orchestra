/* eslint-env jest */

import rimraf from 'rimraf'
import tmp from 'tmp'

import { pFromCallback } from './utils'
import { getHandler } from '.'

const initialDir = process.cwd()

beforeEach(async () => {
  const dir = await pFromCallback(cb => tmp.dir(cb))
  process.chdir(dir)
})

afterEach(async () => {
  const tmpDir = process.cwd()
  process.chdir(initialDir)
  await pFromCallback(cb => rimraf(tmpDir, cb))
})

test("fs test doesn't crash", async () => {
  const handler = getHandler({ url: 'file://' + process.cwd() })
  const result = await handler.test()
  expect(result.success).toBeTruthy()
})
