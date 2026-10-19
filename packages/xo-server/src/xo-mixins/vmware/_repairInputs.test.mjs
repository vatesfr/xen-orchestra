import { strict as assert } from 'node:assert'
import test from 'node:test'

import {
  buildLinuxNics,
  buildRepairXenstoreData,
  buildWindowsNics,
  clearRepairXenstoreData,
  describeFailures,
  describeRepair,
  getBlockingFindings,
  isFirstBootOver,
  isRepairDone,
  isRepairIsoName,
  isRepairIsoVersion,
  readFirstBootState,
  readRepairOutput,
  REPAIR_DESCRIPTION_MARKER,
  replaceRepairDescription,
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

test('describeRepair', async t => {
  const report = ({ actions = [], findings = [], ...rest } = {}) => ({
    result: 'ok',
    firmware: 'uefi',
    disks: ['xvda'],
    tools: 'xvdd',
    os: { kind: 'windows', name: 'Windows Server 2019' },
    network: [],
    findings,
    actions,
    ...rest,
  })

  await t.test('lists the actions and the findings worth a look of a repair', () => {
    const repair = report({
      result: 'warning',
      actions: [
        { code: 'disable_vmware_services', status: 'done' },
        { code: 'windows_static_ip', status: 'failed', error: 'no adapter' },
      ],
      findings: [
        { level: 'info', code: 'bitlocker' },
        { level: 'warning', code: 'windows_static_ip_unmapped', message: 'Ethernet0' },
        { level: 'error', code: 'action_failed', message: 'no adapter' },
      ],
    })
    assert.equal(
      describeRepair({ reports: { diagnose: report(), repair }, isoVersion: '20261018' }),
      [
        REPAIR_DESCRIPTION_MARKER,
        'ISO: 20261018',
        'repair: warning',
        'OS: Windows Server 2019 (uefi)',
        'actions:',
        '- disable_vmware_services: done',
        '- windows_static_ip: failed (no adapter)',
        'findings:',
        '- warning windows_static_ip_unmapped: Ethernet0',
      ].join('\n')
    )
  })

  await t.test('says a guest blocked at the diagnose was not changed', () => {
    const diagnose = report({
      result: 'error',
      firmware: null,
      os: { kind: 'linux' },
      findings: [{ level: 'error', code: 'dynamic_disk' }],
    })
    assert.equal(
      describeRepair({
        reports: { diagnose },
        error: { message: 'the guest cannot be repaired: dynamic_disk' },
        isoVersion: '20261018',
      }),
      [
        REPAIR_DESCRIPTION_MARKER,
        'ISO: 20261018',
        'repair failed: the guest cannot be repaired: dynamic_disk',
        'OS: linux',
        'the guest was only diagnosed, nothing was changed in it',
        'findings:',
        '- error dynamic_disk',
      ].join('\n')
    )
  })

  await t.test('keeps the error of a failure without any report', () => {
    assert.equal(
      describeRepair({ error: { message: 'the repair ISO did not report its result in time' }, isoVersion: '1' }),
      [REPAIR_DESCRIPTION_MARKER, 'ISO: 1', 'repair failed: the repair ISO did not report its result in time'].join(
        '\n'
      )
    )
  })

  await t.test('adds the failure of the first boot and says when details were dropped', () => {
    const summary = describeRepair({
      reports: { diagnose: report(), repair: report({ truncated: true }) },
      firstBootError: { message: 'the guest agent did not report in time' },
      isoVersion: '1',
    })
    assert.ok(
      summary.endsWith(
        'details were dropped from the report to fit in xenstore\nfirst boot failed: the guest agent did not report in time'
      )
    )
  })
})

test('replaceRepairDescription', async t => {
  const summary = `${REPAIR_DESCRIPTION_MARKER}\nISO: 2`

  await t.test('appends the summary to the description', () => {
    assert.equal(replaceRepairDescription('from esxi', summary), `from esxi\n\n${summary}`)
    assert.equal(replaceRepairDescription('', summary), summary)
  })

  await t.test('replaces the summary of a previous write', () => {
    const previous = replaceRepairDescription('from esxi', `${REPAIR_DESCRIPTION_MARKER}\nISO: 1\nrepair: ok`)
    assert.equal(replaceRepairDescription(previous, summary), `from esxi\n\n${summary}`)
  })
})
