/* eslint-env jest */

import execa from 'execa'
import rimraf from 'rimraf'
import tmp from 'tmp'
import { fromCallback as pFromCallback } from 'promise-toolbox'

import command from './commands/info'

const initialDir = process.cwd()

jest.setTimeout(10000)

beforeEach(async () => {
  const dir = await pFromCallback(cb => tmp.dir(cb))
  process.chdir(dir)
})

afterEach(async () => {
  const tmpDir = process.cwd()
  process.chdir(initialDir)
  await pFromCallback(cb => rimraf(tmpDir, cb))
})

test('can run the command', async () => {
  await execa('qemu-img', ['create', '-fvpc', 'empty.vhd', '1G'])
  await command(['empty.vhd'])
})
