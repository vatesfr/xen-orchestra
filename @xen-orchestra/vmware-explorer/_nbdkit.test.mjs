import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { formatNbdkitArgs } from './_nbdkit.mjs'

const PARAMS = {
  compression: 'fastlz',
  diskPath: '[ds main] a.vm/a.vm.vmdk',
  host: 'esxi.test',
  libdir: '/usr/local/lib/vddk/vmware-vix-disklib-distrib',
  passFile: '/tmp/xo-server-42/params',
  port: 11000,
  singleLink: false,
  threads: 1,
  thumbprint: 'AA:BB:CC',
  user: 'root',
  vmId: 'vm-42',
}

describe('formatNbdkitArgs', function () {
  it('never passes an empty argument', function () {
    // an empty argument sits in the slot of the magic positional parameter of the plugin
    for (const singleLink of [false, true]) {
      const args = formatNbdkitArgs({ ...PARAMS, singleLink })
      assert.equal(
        args.every(argument => argument.length > 0),
        true,
        JSON.stringify(args)
      )
    }
  })

  it('exports read only, exits with its parent, and reads the password from a file', function () {
    const args = formatNbdkitArgs(PARAMS)

    assert.ok(args.includes('-r'))
    assert.ok(args.includes('--exit-with-parent'))
    assert.ok(args.includes(`password=+${PARAMS.passFile}`))
    // the password itself never appears in the command line, which is world readable
    assert.equal(
      args.some(argument => argument.includes('password=') && !argument.startsWith('password=+')),
      false
    )
  })

  it('restricts the export to the top delta only when asked', function () {
    assert.equal(formatNbdkitArgs(PARAMS).includes('single-link=true'), false)
    assert.equal(formatNbdkitArgs({ ...PARAMS, singleLink: true }).includes('single-link=true'), true)
  })

  it('ends with the disk to export', function () {
    const args = formatNbdkitArgs({ ...PARAMS, singleLink: true })

    assert.equal(args[args.length - 1], PARAMS.diskPath)
  })
})
