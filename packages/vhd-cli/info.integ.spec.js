'use strict'

/* eslint-env jest */

const execa = require('execa')
const rimraf = require('rimraf')
const tmp = require('tmp')
const { pFromCallback } = require('promise-toolbox')

const command = require('./commands/info')

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
