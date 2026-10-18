// The contract with the repair ISO (repository xo-v2v-repair-iso): XO writes its inputs in `VM.xenstore_data`, the
// ISO reads them from the guest and writes its outputs under `out/`, which XAPI syncs back into
// `VM.xenstore_data`, where they stay after the VM halts.

/**
 * Build of the repair ISO this version of XO is tested with: its date (`YYYYMMDD`), or a release tag.
 * Several builds can be deployed side by side, the CI names each one `xo-repair-<date>-<commit>.iso`
 */
export const REPAIR_ISO_VERSION = '20261018'

/**
 * Whether a VDI is the repair ISO of this build: `xo-repair-20261018-0d5f013b.iso`, or `xo-repair-1.0.0.iso` for
 * a release tag.
 *
 * @param {string} name - `name_label` of the VDI
 * @param {string} version
 */
export const isRepairIsoName = (name, version) =>
  name === `xo-repair-${version}.iso` || (name.startsWith(`xo-repair-${version}-`) && name.endsWith('.iso'))

/**
 * Whether the version an ISO reports (`out/version`, e.g. `20261018-0d5f013b`) is of this build.
 *
 * @param {string | undefined} reported
 * @param {string} version
 */
export const isRepairIsoVersion = (reported, version) =>
  reported !== undefined && (reported === version || reported.startsWith(`${version}-`))

const PREFIX = 'vm-data/xo-repair/'
const OUTPUT_PREFIX = PREFIX + 'out/'
const PARENT_KEY = 'vm-data/xo-repair'

// where a repair run writes its full report and log, in the guest
const GUEST_LOGS = { linux: '/var/log/xo-repair/', windows: 'C:\\xo-repair\\' }

/**
 * The `nics` input of a Linux guest: the name each NIC had in the guest on VMware, by MAC.
 *
 * The predictable name derives from the PCI slot (192 → `ens192`). With a single NIC the ISO finds the
 * name by itself, from the network configuration of the guest, which is more reliable than a guess.
 *
 * @param {readonly { macAddress?: string, pciSlotNumber?: number }[]} networks - from `getTransferableVmMetadata`
 * @returns {string | undefined}
 */
export function buildLinuxNics(networks) {
  if (networks.length < 2) {
    return
  }
  const namedNics = networks.filter(
    ({ macAddress, pciSlotNumber }) => macAddress !== undefined && pciSlotNumber !== undefined
  )
  if (namedNics.length === 0) {
    return
  }
  return namedNics.map(({ macAddress, pciSlotNumber }) => `ens${pciSlotNumber}=${macAddress.toLowerCase()}`).join(';')
}

/**
 * The `windows-nics` input of a Windows guest: the VIF which gets the static configuration of each old
 * adapter, matched by address.
 *
 * The registry names an adapter by GUID, vSphere names a card by MAC: the addresses the guest reported to
 * vSphere before the migration (`guestNics`) are matched with the ones the ISO read in the registry
 * (`network` of the diagnose report). An adapter matching no card, or several, is left out: the ISO then
 * reports it in `windows_static_ip_unmapped`. With a single NIC the ISO matches it by itself.
 *
 * @param {object} params
 * @param {readonly { macAddress?: string, addresses: string[] }[]} params.guestNics - from `getTransferableVmMetadata`
 * @param {readonly { macAddress?: string }[]} params.networks - the cards of the VM, whose MACs the VIFs keep
 * @param {readonly { guid?: string, dhcp?: boolean, addresses?: string[] }[]} params.reportNetwork
 * @returns {string | undefined}
 */
export function buildWindowsNics({ guestNics, networks, reportNetwork }) {
  if (networks.length < 2) {
    return
  }
  const vifMacs = new Set(networks.map(({ macAddress }) => macAddress?.toLowerCase()))
  // a card of the guest only (VPN…) has no VIF
  const cards = guestNics
    .filter(({ macAddress }) => macAddress !== undefined && vifMacs.has(macAddress.toLowerCase()))
    .map(({ macAddress, addresses }) => ({
      macAddress: macAddress.toLowerCase(),
      addresses: new Set(addresses.map(address => address.toLowerCase())),
    }))

  const guidsByMac = new Map()
  for (const { guid, dhcp, addresses = [] } of reportNetwork) {
    if (dhcp || guid === undefined || addresses.length === 0) {
      continue
    }
    const hasAddressOf = card => addresses.some(address => card.addresses.has(address.toLowerCase()))
    const matchingCards = cards.filter(hasAddressOf)
    if (matchingCards.length === 1) {
      const { macAddress } = matchingCards[0]
      guidsByMac.set(macAddress, [...(guidsByMac.get(macAddress) ?? []), guid])
    }
  }

  // two adapters claiming the same card: neither is reliable
  const pairs = [...guidsByMac].filter(([, guids]) => guids.length === 1).map(([mac, [guid]]) => `${mac}=${guid}`)
  return pairs.length === 0 ? undefined : pairs.join(';')
}

/**
 * `xenstore_data` without any key of the ISO, once it is not needed anymore.
 *
 * @param {Readonly<Record<string, string>>} current
 * @returns {Record<string, string>}
 */
export const clearRepairXenstoreData = current =>
  // the parent node too, synced back by XAPI with an empty value
  Object.fromEntries(Object.entries(current).filter(([key]) => key !== PARENT_KEY && !key.startsWith(PREFIX)))

/**
 * The whole `xenstore_data` to set before a boot on the ISO.
 *
 * `xenstore_data` survives the halt of the VM: every key of the ISO left by a previous run, input or
 * output, is dropped, otherwise a `done` of that run could be read as the result of this one.
 *
 * @param {Readonly<Record<string, string>>} current - current `VM.xenstore_data`
 * @param {object} inputs - unset inputs use the default of the ISO
 * @param {'diagnose' | 'repair'} inputs.mode
 * @param {string} [inputs.nics]
 * @param {'standard' | 'full'} [inputs.windowsCleanup]
 * @param {string} [inputs.windowsMsiPatterns]
 * @param {string} [inputs.windowsNics]
 * @returns {Record<string, string>}
 */
export function buildRepairXenstoreData(current, { mode, nics, windowsCleanup, windowsMsiPatterns, windowsNics }) {
  const xenstoreData = clearRepairXenstoreData(current)
  const inputs = {
    mode,
    nics,
    'windows-cleanup': windowsCleanup,
    'windows-msi-patterns': windowsMsiPatterns,
    'windows-nics': windowsNics,
  }
  for (const [key, value] of Object.entries(inputs)) {
    if (value !== undefined) {
      xenstoreData[PREFIX + key] = value
    }
  }
  return xenstoreData
}

/**
 * @typedef {object} RepairOutput
 * @property {string | undefined} state - `running`, then `done` once every other output is final
 * @property {string | undefined} result - `ok`, `warning` or `error`
 * @property {string | undefined} mode
 * @property {string | undefined} version
 * @property {string | undefined} firstboot
 * @property {RepairReport | undefined} report
 */

/**
 * @typedef {object} RepairReport - compact report of the ISO, details may have been dropped to fit in xenstore
 * @property {string} result
 * @property {string | null} firmware
 * @property {string[]} disks
 * @property {string | null} tools - device of the guest tools disk, `null` when it was not found
 * @property {{ kind?: 'linux' | 'windows', name?: string, rtc_timeoffset?: number | null }} os
 * @property {object[]} network - Windows: the TCP/IP configuration of the old adapters
 * @property {{ level: 'info' | 'warning' | 'error', code: string, message?: string, data?: object }[]} findings
 * @property {{ code: string, status: string, error?: string }[]} actions
 */

/**
 * @param {Readonly<Record<string, string>>} xenstoreData - `VM.xenstore_data`
 * @returns {boolean}
 */
export const isRepairDone = xenstoreData => xenstoreData[OUTPUT_PREFIX + 'state'] === 'done'

/**
 * @param {Readonly<Record<string, string>>} xenstoreData - `VM.xenstore_data`
 * @param {object} context - attached to the error, e.g. `{ vmId }`
 * @returns {RepairOutput}
 */
export function readRepairOutput(xenstoreData, context) {
  const get = key => xenstoreData[OUTPUT_PREFIX + key]
  const rawReport = get('report')
  let report
  if (rawReport !== undefined) {
    try {
      report = JSON.parse(rawReport)
    } catch (cause) {
      const error = new Error('the report of the repair ISO is not valid JSON')
      error.code = 'REPAIR_REPORT_INVALID'
      error.cause = cause
      Object.assign(error, context, { rawReport })
      throw error
    }
  }
  return {
    state: get('state'),
    result: get('result'),
    mode: get('mode'),
    version: get('version'),
    firstboot: get('firstboot'),
    report,
  }
}

/**
 * The state of the Windows first boot, written by its script once the PV drivers are loaded:
 * `<phase>:running`, `<phase>:error` (retried at the next boot), `<phase>:failed` (given up) or `done`.
 *
 * @param {Readonly<Record<string, string>>} xenstoreData - `VM.xenstore_data`
 * @returns {string | undefined}
 */
export const readFirstBootState = xenstoreData => xenstoreData[OUTPUT_PREFIX + 'firstboot']

/**
 * @param {string | undefined} state - from `readFirstBootState`
 * @returns {boolean} whether the first boot will not report anything more
 */
export const isFirstBootOver = state => state === 'done' || (state?.endsWith(':failed') ?? false)

/**
 * The findings which stopped the ISO from modifying anything.
 *
 * @param {RepairReport} report
 */
export const getBlockingFindings = report => report.findings.filter(finding => finding.level === 'error')

/**
 * What went wrong in a run, for humans: the failed actions and the blocking findings, with their message
 * when the report still has it. A failed critical action is also reported as an `action_failed` finding
 * repeating its error, left out here.
 *
 * @param {RepairReport} report
 * @returns {string[]}
 */
export function describeFailures(report) {
  const failedActions = report.actions
    .filter(action => action.status === 'failed')
    .map(({ code, error }) => (error === undefined ? code : `${code}: ${error}`))
  const blockingFindings = getBlockingFindings(report)
    .filter(finding => finding.code !== 'action_failed')
    .map(({ code, message }) => (message === undefined ? code : `${code}: ${message}`))
  const failures = [...failedActions, ...blockingFindings]
  if (report.truncated) {
    failures.push('details were dropped from the report to fit in xenstore')
  }
  return failures
}

/**
 * Where the full report and log of a repair run are in the guest. A diagnose run writes nothing.
 *
 * @param {RepairReport} report
 * @returns {string | undefined}
 */
export const guestLogsOf = report => GUEST_LOGS[report.os?.kind]

/**
 * The `userdevice` of a disk named by the ISO, `xvdb` → `1`.
 *
 * @param {string} name
 * @returns {string | undefined}
 */
export function userdeviceOfXvd(name) {
  const matches = /^xvd([a-z])$/.exec(name)
  if (matches === null) {
    return
  }
  return String(matches[1].charCodeAt(0) - 'a'.charCodeAt(0))
}
