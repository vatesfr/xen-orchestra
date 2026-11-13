import { strict as assert } from 'node:assert'
import test from 'node:test'

import {
  describeRepair,
  FIRST_BOOT_LEFT_TO_XO,
  REPAIR_DESCRIPTION_MARKER,
  replaceRepairDescription,
} from './_repairDescription.mjs'

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
      describeRepair({ reports: { diagnose: report(), repair } }),
      [
        REPAIR_DESCRIPTION_MARKER,
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
      }),
      [
        REPAIR_DESCRIPTION_MARKER,
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
      describeRepair({ error: { message: 'the repair ISO did not report its result in time' } }),
      [REPAIR_DESCRIPTION_MARKER, 'repair failed: the repair ISO did not report its result in time'].join('\n')
    )
  })

  await t.test('follows the first boot: the restarts done by XO, then its end or its failure', () => {
    const reports = { diagnose: report(), repair: report() }
    const restarted = { restartedAfter: ['drivers'], done: false }
    assert.ok(
      describeRepair({ reports, firstBoot: { ...restarted, done: true } }).endsWith(
        ['first boot: drivers phase done, VM restarted by XO', 'first boot: done'].join('\n')
      )
    )
    assert.ok(
      describeRepair({
        reports,
        firstBoot: restarted,
        firstBootError: { message: 'the Windows first boot did not complete' },
      }).endsWith('drivers phase done, VM restarted by XO\nfirst boot failed: the Windows first boot did not complete')
    )
  })

  await t.test('says the VM must be started again while a first boot left to XO is not done', () => {
    const firstBootInstalled = report({ actions: [{ code: 'install_firstboot', status: 'applied' }] })
    const reports = { diagnose: report(), repair: firstBootInstalled, windowsReboot: 'xo' }
    // written once repaired: XO may stop following without writing anything more
    assert.ok(describeRepair({ reports }).endsWith(`\n${FIRST_BOOT_LEFT_TO_XO}`))
    assert.ok(
      describeRepair({
        reports,
        firstBoot: { restartedAfter: [], done: false },
        firstBootError: { message: 'aborted' },
      }).endsWith(`first boot failed: aborted\n${FIRST_BOOT_LEFT_TO_XO}`)
    )

    assert.ok(
      !describeRepair({ reports, firstBoot: { restartedAfter: ['drivers'], done: true } }).includes(
        FIRST_BOOT_LEFT_TO_XO
      )
    )
    // the guest reboots itself
    assert.ok(!describeRepair({ reports: { ...reports, windowsReboot: 'guest' } }).includes(FIRST_BOOT_LEFT_TO_XO))
    // no first boot installed
    assert.ok(!describeRepair({ reports: { ...reports, repair: report() } }).includes(FIRST_BOOT_LEFT_TO_XO))
  })

  await t.test('adds the failure of the first boot and says when details were dropped', () => {
    const summary = describeRepair({
      reports: { diagnose: report(), repair: report({ truncated: true }) },
      firstBootError: { message: 'the guest agent did not report in time' },
    })
    assert.ok(
      summary.endsWith(
        'details were dropped from the report to fit in xenstore\nfirst boot failed: the guest agent did not report in time'
      )
    )
  })
})

test('replaceRepairDescription', async t => {
  const summary = `${REPAIR_DESCRIPTION_MARKER}\nrepair: warning`

  await t.test('appends the summary to the description', () => {
    assert.equal(replaceRepairDescription('from esxi', summary), `from esxi\n\n${summary}`)
    assert.equal(replaceRepairDescription('', summary), summary)
  })

  await t.test('replaces the summary of a previous write', () => {
    const previous = replaceRepairDescription('from esxi', `${REPAIR_DESCRIPTION_MARKER}\nrepair: ok`)
    assert.equal(replaceRepairDescription(previous, summary), `from esxi\n\n${summary}`)
  })
})
