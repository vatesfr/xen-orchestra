// The contract with the docking ISO (package @xen-orchestra/autopilot-docking): XO writes its inputs in `VM.xenstore_data`, the
// ISO reads them from the guest and writes its outputs under `out/`, which XAPI syncs back into
// `VM.xenstore_data`, where they stay after the VM halts.

// `vates-autopilot-docking-<build date and time>-<suffix>.iso`, as `scripts/build.sh` names its builds: the date
// and time in UTC, the suffix is the commit, maybe `-dirty`, or the version of a release. The date first: the most
// recent ISO is the last one by name
const DOCKING_ISO_NAME_RE = /^vates-autopilot-docking-\d{8}T\d{6}Z-(?:[0-9a-f]{8}(?:-dirty)?|\d+\.\d+\.\d+)\.iso$/

/**
 * Whether a VDI is the docking ISO: `vates-autopilot-docking-20261018T084512Z-0d5f013b.iso` or
 * `vates-autopilot-docking-20261018T084512Z-1.2.0.iso`.
 *
 * @param {string} name - `name_label` of the VDI
 */
export const isDockingIsoName = name => DOCKING_ISO_NAME_RE.test(name)

const PREFIX = 'vm-data/xo-docking/'
const OUTPUT_PREFIX = PREFIX + 'out/'
const PARENT_KEY = 'vm-data/xo-docking'

// where a dock run writes its full report and log, in the guest
const GUEST_LOGS = { linux: '/var/log/xo-docking/', windows: 'C:\\xo-docking\\' }

// where the first-boot script of Windows logs each of its phases
export const WINDOWS_FIRST_BOOT_LOG = GUEST_LOGS.windows + 'firstboot.log'

// The codes of the report XO acts on. The ISO keeps them when it trims its report to fit in xenstore: the errors
// always, the others because `XO_CODES` of its `report.py` lists them, which must follow this list
export const FINDING = Object.freeze({
  ACTION_FAILED: 'action_failed',
  BOOT_DISK_NOT_FIRST: 'boot_disk_not_first',
  GUEST_AGENT_MISSING: 'guest_agent_missing',
  GUEST_AGENT_UNSUPPORTED: 'guest_agent_unsupported',
  PV_DRIVERS_UNSUPPORTED: 'pv_drivers_unsupported',
  WINDOWS_FIRSTBOOT_INCOMPLETE: 'windows_firstboot_incomplete',
  WINDOWS_STATIC_IP_UNMAPPED: 'windows_static_ip_unmapped',
})
export const ACTION = Object.freeze({
  INSTALL_FIRSTBOOT: 'install_firstboot',
  INSTALL_GUEST_AGENT: 'install_guest_agent',
})

/**
 * @param {DockingReport} report
 * @param {string} code - from `FINDING`
 * @returns {DockingReport['findings'][number] | undefined}
 */
export const findFinding = (report, code) => report.findings.find(finding => finding.code === code)

/**
 * @param {DockingReport} report
 * @param {string} code - from `ACTION`
 * @returns {string | undefined} `planned`, `applied`, `failed` or `skipped`, undefined when not planned
 */
export const actionStatus = (report, code) => report.actions.find(action => action.code === code)?.status

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
export const clearDockingXenstoreData = current =>
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
 * @param {'diagnose' | 'dock'} inputs.mode
 * @param {string} [inputs.nics]
 * @param {string} [inputs.windowsNics]
 * @param {'guest' | 'xo'} [inputs.windowsReboot] - `xo`: the first boot stops the VM between its phases, for XO
 * to start it again
 * @returns {Record<string, string>}
 */
export function buildDockingXenstoreData(current, { mode, nics, windowsNics, windowsReboot }) {
  const xenstoreData = clearDockingXenstoreData(current)
  const inputs = {
    mode,
    nics,
    'windows-nics': windowsNics,
    'windows-reboot': windowsReboot,
  }
  for (const [key, value] of Object.entries(inputs)) {
    if (value !== undefined) {
      xenstoreData[PREFIX + key] = value
    }
  }
  return xenstoreData
}

/**
 * @typedef {object} DockingOutput
 * @property {string | undefined} state - `running`, then `done` once every other output is final
 * @property {string | undefined} result - `ok`, `warning` or `error`
 * @property {string | undefined} mode
 * @property {string | undefined} version
 * @property {string | undefined} firstboot
 * @property {DockingReport | undefined} report
 */

/**
 * @typedef {object} DockingReport - compact report of the ISO, details may have been dropped to fit in xenstore
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
export const isDockingDone = xenstoreData => xenstoreData[OUTPUT_PREFIX + 'state'] === 'done'

/**
 * @param {Readonly<Record<string, string>>} xenstoreData - `VM.xenstore_data`
 * @param {object} context - attached to the error, e.g. `{ vmId }`
 * @returns {DockingOutput}
 */
export function readDockingOutput(xenstoreData, context) {
  const get = key => xenstoreData[OUTPUT_PREFIX + key]
  const rawReport = get('report')
  let report
  if (rawReport !== undefined) {
    try {
      report = JSON.parse(rawReport)
    } catch (cause) {
      const error = new Error('the report of the docking ISO is not valid JSON')
      error.code = 'DOCKING_REPORT_INVALID'
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
 * @param {DockingReport} report
 */
export const getBlockingFindings = report => report.findings.filter(finding => finding.level === 'error')

/**
 * What went wrong in a run, for humans: the failed actions and the blocking findings, with their message
 * when the report still has it. A failed critical action is also reported as an `action_failed` finding
 * repeating its error, left out here.
 *
 * @param {DockingReport} report
 * @returns {string[]}
 */
export function describeFailures(report) {
  const failedActions = report.actions
    .filter(action => action.status === 'failed')
    .map(({ code, error }) => (error === undefined ? code : `${code}: ${error}`))
  const blockingFindings = getBlockingFindings(report)
    .filter(finding => finding.code !== FINDING.ACTION_FAILED)
    .map(({ code, message }) => (message === undefined ? code : `${code}: ${message}`))
  const failures = [...failedActions, ...blockingFindings]
  if (report.truncated) {
    failures.push('details were dropped from the report to fit in xenstore')
  }
  return failures
}

/**
 * Where the full report and log of a dock run are in the guest. A diagnose run writes nothing.
 *
 * @param {DockingReport} report
 * @returns {string | undefined}
 */
export const guestLogsOf = report => GUEST_LOGS[report.os?.kind]

/**
 * @typedef {object} FirstBootProgress - of the Windows first boot followed by XO
 * @property {string[]} restartedAfter - the phases after which XO started the VM again, in order
 * @property {boolean} done - whether the first boot reported its end
 */

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
