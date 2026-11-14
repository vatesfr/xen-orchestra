import { strict as assert } from 'node:assert'
import test from 'node:test'

import {
  describeDocking,
  FIRST_BOOT_LEFT_TO_XO,
  DOCKING_DESCRIPTION_MARKER,
  replaceDockingDescription,
} from './_dockingDescription.mjs'

test('describeDocking', async t => {
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

  await t.test('lists the actions and the findings worth a look of a docking', () => {
    const dock = report({
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
      describeDocking({ reports: { diagnose: report(), dock } }),
      [
        DOCKING_DESCRIPTION_MARKER,
        'docking: warning',
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
      describeDocking({
        reports: { diagnose },
        error: { message: 'the guest cannot be docked: dynamic_disk' },
      }),
      [
        DOCKING_DESCRIPTION_MARKER,
        'docking failed: the guest cannot be docked: dynamic_disk',
        'OS: linux',
        'the guest was only diagnosed, nothing was changed in it',
        'findings:',
        '- error dynamic_disk',
      ].join('\n')
    )
  })

  await t.test('keeps the error of a failure without any report', () => {
    assert.equal(
      describeDocking({ error: { message: 'the docking ISO did not report its result in time' } }),
      [DOCKING_DESCRIPTION_MARKER, 'docking failed: the docking ISO did not report its result in time'].join('\n')
    )
  })

  await t.test('follows the first boot: the restarts done by XO, then its end or its failure', () => {
    const reports = { diagnose: report(), dock: report() }
    const restarted = { restartedAfter: ['drivers'], done: false }
    assert.ok(
      describeDocking({ reports, firstBoot: { ...restarted, done: true } }).endsWith(
        ['first boot: drivers phase done, VM restarted by XO', 'first boot: done'].join('\n')
      )
    )
    assert.ok(
      describeDocking({
        reports,
        firstBoot: restarted,
        firstBootError: { message: 'the Windows first boot did not complete' },
      }).endsWith('drivers phase done, VM restarted by XO\nfirst boot failed: the Windows first boot did not complete')
    )
  })

  await t.test('says the VM must be started again while a first boot left to XO is not done', () => {
    const firstBootInstalled = report({ actions: [{ code: 'install_firstboot', status: 'applied' }] })
    const reports = { diagnose: report(), dock: firstBootInstalled, windowsReboot: 'xo' }
    // written once docked: XO may stop following without writing anything more
    assert.ok(describeDocking({ reports }).endsWith(`\n${FIRST_BOOT_LEFT_TO_XO}`))
    assert.ok(
      describeDocking({
        reports,
        firstBoot: { restartedAfter: [], done: false },
        firstBootError: { message: 'aborted' },
      }).endsWith(`first boot failed: aborted\n${FIRST_BOOT_LEFT_TO_XO}`)
    )

    assert.ok(
      !describeDocking({ reports, firstBoot: { restartedAfter: ['drivers'], done: true } }).includes(
        FIRST_BOOT_LEFT_TO_XO
      )
    )
    // the guest reboots itself
    assert.ok(!describeDocking({ reports: { ...reports, windowsReboot: 'guest' } }).includes(FIRST_BOOT_LEFT_TO_XO))
    // no first boot installed
    assert.ok(!describeDocking({ reports: { ...reports, dock: report() } }).includes(FIRST_BOOT_LEFT_TO_XO))
  })

  await t.test('adds the failure of the first boot and says when details were dropped', () => {
    const summary = describeDocking({
      reports: { diagnose: report(), dock: report({ truncated: true }) },
      firstBootError: { message: 'the guest agent did not report in time' },
    })
    assert.ok(
      summary.endsWith(
        'details were dropped from the report to fit in xenstore\nfirst boot failed: the guest agent did not report in time'
      )
    )
  })
})

test('replaceDockingDescription', async t => {
  const summary = `${DOCKING_DESCRIPTION_MARKER}\ndocking: warning`

  await t.test('appends the summary to the description', () => {
    assert.equal(replaceDockingDescription('from esxi', summary), `from esxi\n\n${summary}`)
    assert.equal(replaceDockingDescription('', summary), summary)
  })

  await t.test('replaces the summary of a previous write', () => {
    const previous = replaceDockingDescription('from esxi', `${DOCKING_DESCRIPTION_MARKER}\ndocking: ok`)
    assert.equal(replaceDockingDescription(previous, summary), `from esxi\n\n${summary}`)
  })
})
