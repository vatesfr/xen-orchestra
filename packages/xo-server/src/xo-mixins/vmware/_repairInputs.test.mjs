import { strict as assert } from 'node:assert'
import test from 'node:test'

import {
  buildLinuxNics,
  buildRepairXenstoreData,
  buildWindowsNics,
  clearRepairXenstoreData,
  describeFailures,
  getBlockingFindings,
  isFirstBootOver,
  isRepairDone,
  isRepairIsoName,
  isRepairIsoVersion,
  readFirstBootState,
  readRepairOutput,
  userdeviceOfXvd,
} from './_repairInputs.mjs'

test('buildLinuxNics', async t => {
  await t.test('names each NIC after its PCI slot', () => {
    assert.equal(
      buildLinuxNics([
        { macAddress: '00:0C:29:D4:BF:19', pciSlotNumber: 192 },
        { macAddress: '00:0c:29:d4:bf:23', pciSlotNumber: 224 },
      ]),
      'ens192=00:0c:29:d4:bf:19;ens224=00:0c:29:d4:bf:23'
    )
  })

  await t.test('leaves a single NIC to the ISO', () => {
    assert.equal(buildLinuxNics([{ macAddress: '00:0c:29:d4:bf:19', pciSlotNumber: 192 }]), undefined)
    assert.equal(buildLinuxNics([]), undefined)
  })

  await t.test('skips the NICs without slot or MAC', () => {
    assert.equal(
      buildLinuxNics([
        { macAddress: '00:0c:29:d4:bf:19', pciSlotNumber: 192 },
        { macAddress: '00:0c:29:d4:bf:23' },
        { pciSlotNumber: 256 },
      ]),
      'ens192=00:0c:29:d4:bf:19'
    )
    assert.equal(buildLinuxNics([{ macAddress: '00:0c:29:d4:bf:19' }, { macAddress: '00:0c:29:d4:bf:23' }]), undefined)
  })
})

test('buildWindowsNics', async t => {
  const networks = [{ macAddress: '00:0C:29:94:80:0D' }, { macAddress: '00:0c:29:94:80:17' }]
  const guestNics = [
    { macAddress: '00:0c:29:94:80:0d', addresses: ['192.168.1.10', 'fe80::1'] },
    { macAddress: '00:0c:29:94:80:17', addresses: ['10.0.0.10', 'FD00::10'] },
    // a card of the guest only, with an address of its own
    { macAddress: '02:00:00:00:00:01', addresses: ['172.16.0.1'] },
  ]
  const adapter = (guid, addresses, dhcp = false) => ({ guid, addresses, dhcp })

  await t.test('matches each static adapter with the card having its address', () => {
    assert.equal(
      buildWindowsNics({
        guestNics,
        networks,
        reportNetwork: [adapter('{A}', ['192.168.1.10']), adapter('{B}', ['fd00::10'])],
      }),
      '00:0c:29:94:80:0d={A};00:0c:29:94:80:17={B}'
    )
  })

  await t.test('leaves out the adapters in DHCP, unknown, or matching a card of the guest only', () => {
    assert.equal(
      buildWindowsNics({
        guestNics,
        networks,
        reportNetwork: [
          adapter('{A}', ['192.168.1.10'], true),
          adapter('{B}', ['10.9.9.9']),
          adapter('{C}', ['172.16.0.1']),
          { addresses: ['10.0.0.10'], dhcp: false },
        ],
      }),
      undefined
    )
  })

  await t.test('leaves out adapters which match several cards, or a card claimed twice', () => {
    const sharedAddress = [
      { macAddress: '00:0c:29:94:80:0d', addresses: ['10.0.0.10'] },
      { macAddress: '00:0c:29:94:80:17', addresses: ['10.0.0.10'] },
    ]
    assert.equal(
      buildWindowsNics({ guestNics: sharedAddress, networks, reportNetwork: [adapter('{A}', ['10.0.0.10'])] }),
      undefined
    )
    assert.equal(
      buildWindowsNics({
        guestNics,
        networks,
        reportNetwork: [adapter('{A}', ['192.168.1.10']), adapter('{B}', ['fe80::1']), adapter('{C}', ['10.0.0.10'])],
      }),
      '00:0c:29:94:80:17={C}'
    )
  })

  await t.test('leaves a single NIC, or no capture, to the ISO', () => {
    const reportNetwork = [adapter('{A}', ['192.168.1.10'])]
    assert.equal(buildWindowsNics({ guestNics, networks: networks.slice(0, 1), reportNetwork }), undefined)
    assert.equal(buildWindowsNics({ guestNics: [], networks, reportNetwork }), undefined)
  })
})

test('buildRepairXenstoreData', async t => {
  const previousRun = {
    'vm-data/other': 'kept',
    'vm-data/xo-repair': '',
    'vm-data/xo-repair/mode': 'repair',
    'vm-data/xo-repair/nics': 'ens192=00:0c:29:d4:bf:19;ens224=00:0c:29:d4:bf:23',
    'vm-data/xo-repair/keep-running': '1',
    'vm-data/xo-repair/out/state': 'done',
    'vm-data/xo-repair/out/report': '{}',
  }

  await t.test('drops every key of a previous run, keeps the others', () => {
    assert.deepEqual(buildRepairXenstoreData(previousRun, { mode: 'diagnose' }), {
      'vm-data/other': 'kept',
      'vm-data/xo-repair/mode': 'diagnose',
    })
  })

  await t.test('sets the inputs given', () => {
    assert.deepEqual(
      buildRepairXenstoreData(
        {},
        {
          mode: 'repair',
          nics: 'ens192=00:0c:29:d4:bf:19',
          windowsCleanup: 'full',
          windowsMsiPatterns: 'xen-*.msi;managementagent-*.msi',
          windowsNics: '00:0c:29:94:80:0d={44FED271-EE81-4363-8CF0-893542F0734F}',
        }
      ),
      {
        'vm-data/xo-repair/mode': 'repair',
        'vm-data/xo-repair/nics': 'ens192=00:0c:29:d4:bf:19',
        'vm-data/xo-repair/windows-cleanup': 'full',
        'vm-data/xo-repair/windows-msi-patterns': 'xen-*.msi;managementagent-*.msi',
        'vm-data/xo-repair/windows-nics': '00:0c:29:94:80:0d={44FED271-EE81-4363-8CF0-893542F0734F}',
      }
    )
  })

  await t.test('clearRepairXenstoreData removes inputs and outputs', () => {
    assert.deepEqual(clearRepairXenstoreData(previousRun), { 'vm-data/other': 'kept' })
  })
})

test('readRepairOutput', async t => {
  const report = {
    result: 'error',
    tools: 'xvdz',
    os: { kind: 'linux' },
    network: [],
    findings: [
      { level: 'warning', code: 'linux_interface_names' },
      { level: 'error', code: 'boot_disk_not_first', data: { os_disk: 'xvdb' } },
    ],
    actions: [],
  }
  const xenstoreData = {
    'vm-data/xo-repair/out/version': '20261012-1a2b3c4d',
    'vm-data/xo-repair/out/mode': 'diagnose',
    'vm-data/xo-repair/out/result': 'error',
    'vm-data/xo-repair/out/state': 'done',
    'vm-data/xo-repair/out/report': JSON.stringify(report),
  }

  await t.test('reads every output', () => {
    assert.equal(isRepairDone(xenstoreData), true)
    assert.deepEqual(readRepairOutput(xenstoreData, { vmId: 'vm' }), {
      state: 'done',
      result: 'error',
      mode: 'diagnose',
      version: '20261012-1a2b3c4d',
      firstboot: undefined,
      report,
    })
    assert.deepEqual(
      getBlockingFindings(report).map(({ code }) => code),
      ['boot_disk_not_first']
    )
  })

  await t.test('is not done while running or before the ISO started', () => {
    assert.equal(isRepairDone({ 'vm-data/xo-repair/out/state': 'running' }), false)
    assert.equal(isRepairDone({}), false)
  })

  await t.test('reports an invalid report with its context', () => {
    assert.throws(() => readRepairOutput({ 'vm-data/xo-repair/out/report': '{"trunc' }, { vmId: 'vm' }), {
      code: 'REPAIR_REPORT_INVALID',
      vmId: 'vm',
      rawReport: '{"trunc',
    })
  })
})

test('repair ISO build', () => {
  assert.equal(isRepairIsoName('xo-repair-20261018-0d5f013b.iso', '20261018'), true)
  assert.equal(isRepairIsoName('xo-repair-1.0.0.iso', '1.0.0'), true)
  assert.equal(isRepairIsoName('xo-repair-20261019-0d5f013b.iso', '20261018'), false)
  // a build whose date only starts like the one asked for
  assert.equal(isRepairIsoName('xo-repair-202610180-0d5f013b.iso', '20261018'), false)
  assert.equal(isRepairIsoName('xo-repair-20261018-0d5f013b.img', '20261018'), false)

  assert.equal(isRepairIsoVersion('20261018-0d5f013b', '20261018'), true)
  assert.equal(isRepairIsoVersion('20261018-xotest-0d5f013b-dirty', '20261018'), true)
  assert.equal(isRepairIsoVersion('1.0.0', '1.0.0'), true)
  assert.equal(isRepairIsoVersion('20261017-0d5f013b', '20261018'), false)
  assert.equal(isRepairIsoVersion(undefined, '20261018'), false)
})

test('first boot state', () => {
  assert.equal(readFirstBootState({ 'vm-data/xo-repair/out/firstboot': 'drivers:running' }), 'drivers:running')
  assert.equal(readFirstBootState({}), undefined)

  assert.equal(isFirstBootOver('done'), true)
  assert.equal(isFirstBootOver('drivers:failed'), true)
  // retried at the next boot
  assert.equal(isFirstBootOver('drivers:error'), false)
  assert.equal(isFirstBootOver('finish:running'), false)
  assert.equal(isFirstBootOver(undefined), false)
})

test('describeFailures', () => {
  const report = {
    findings: [
      { level: 'warning', code: 'windows_static_ip' },
      { level: 'error', code: 'action_failed', message: 'install_firstboot: [Errno 28] No space left on device' },
      { level: 'error', code: 'bitlocker', message: 'C: is encrypted' },
      { level: 'error', code: 'dynamic_disk' },
    ],
    actions: [
      { code: 'enable_ide_boot', status: 'applied' },
      { code: 'install_firstboot', status: 'failed', error: '[Errno 28] No space left on device' },
      { code: 'disable_vmware_services', status: 'failed' },
      { code: 'commit_registry', status: 'skipped' },
    ],
  }
  assert.deepEqual(describeFailures(report), [
    'install_firstboot: [Errno 28] No space left on device',
    'disable_vmware_services',
    'bitlocker: C: is encrypted',
    'dynamic_disk',
  ])
  assert.deepEqual(
    describeFailures({ truncated: true, findings: [{ level: 'error', code: 'ntfs_unclean' }], actions: [] }),
    ['ntfs_unclean', 'details were dropped from the report to fit in xenstore']
  )
})

test('userdeviceOfXvd', () => {
  assert.equal(userdeviceOfXvd('xvda'), '0')
  assert.equal(userdeviceOfXvd('xvdb'), '1')
  assert.equal(userdeviceOfXvd('sda'), undefined)
  assert.equal(userdeviceOfXvd('xvdaa'), undefined)
})
