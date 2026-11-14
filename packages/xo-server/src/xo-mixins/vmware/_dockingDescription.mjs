// The summary of the docking written in the description of the VM, where a user looks first: what the docking did,
// how far the first boot went, and what is left to do by hand

import { ACTION, actionStatus, FINDING, WINDOWS_FIRST_BOOT_LOG } from './_dockingInputs.mjs'

/**
 * @typedef {import('./_dockingInputs.mjs').DockingReport} DockingReport
 * @typedef {import('./_dockingInputs.mjs').FirstBootProgress} FirstBootProgress
 */

// starts what the import writes in the description of the VM: a later write replaces everything after it
export const DOCKING_DESCRIPTION_MARKER = '--- Vates Autopilot Docking ---'

const describeAction = ({ code, status, error }) =>
  error === undefined ? `- ${code}: ${status}` : `- ${code}: ${status} (${error})`

const describeFinding = ({ level, code, message }) =>
  message === undefined ? `- ${level} ${code}` : `- ${level} ${code}: ${message}`

/**
 * Whether the guest waits for XO to start it again between the phases of its Windows first boot (`windows-reboot`
 * `xo`): when XO no longer follows it (failed start, cancelled task, restart of XO), each phase ends with the VM
 * stopped, which must be started again by hand.
 *
 * @param {{ dock?: DockingReport, windowsReboot?: string }} reports - from `dockImportedVm`
 */
export const isFirstBootLeftToXo = ({ dock, windowsReboot }) =>
  windowsReboot === 'xo' && dock !== undefined && actionStatus(dock, ACTION.INSTALL_FIRSTBOOT) === 'applied'

export const FIRST_BOOT_LEFT_TO_XO = `Windows stops between the phases of its first boot for XO to start it again: unless XO completed it, start the VM again until ${WINDOWS_FIRST_BOOT_LOG} says it is done`

/**
 * What the docking did to the guest, for humans, as written in the description of the VM.
 *
 * @param {object} params
 * @param {{ diagnose?: DockingReport, dock?: DockingReport, windowsReboot?: string }} [params.reports] - all or part
 * of them on a failure
 * @param {{ message: string }} [params.error] - why the docking failed
 * @param {FirstBootProgress} [params.firstBoot] - how far the first boot of a docked guest went
 * @param {{ message: string }} [params.firstBootError] - why the first boot of a docked guest failed
 * @returns {string}
 */
export function describeDocking({ reports = {}, error, firstBoot, firstBootError }) {
  const lines = [DOCKING_DESCRIPTION_MARKER]
  // the dock run is the one which changed the guest, a diagnose alone did not change anything
  const report = reports.dock ?? reports.diagnose
  if (error !== undefined) {
    lines.push(`docking failed: ${error.message}`)
  } else if (report !== undefined) {
    lines.push(`docking: ${report.result}`)
  }
  if (report !== undefined) {
    const osName = report.os?.name ?? report.os?.kind
    if (osName !== undefined) {
      lines.push(report.firmware ? `OS: ${osName} (${report.firmware})` : `OS: ${osName}`)
    }
    if (reports.dock === undefined) {
      lines.push('the guest was only diagnosed, nothing was changed in it')
    }
    if (report.actions.length !== 0) {
      lines.push('actions:', ...report.actions.map(describeAction))
    }
    // a failed action is already in the actions
    const findings = report.findings.filter(
      finding => finding.level !== 'info' && finding.code !== FINDING.ACTION_FAILED
    )
    if (findings.length !== 0) {
      lines.push('findings:', ...findings.map(describeFinding))
    }
    if (report.truncated) {
      lines.push('details were dropped from the report to fit in xenstore')
    }
  }
  if (firstBoot !== undefined) {
    for (const phase of firstBoot.restartedAfter) {
      lines.push(`first boot: ${phase} phase done, VM restarted by XO`)
    }
    if (firstBoot.done) {
      lines.push('first boot: done')
    }
  }
  if (firstBootError !== undefined) {
    lines.push(`first boot failed: ${firstBootError.message}`)
  }
  // written as soon as the guest is docked: XO may stop following the first boot without writing anything more
  if (isFirstBootLeftToXo(reports) && !firstBoot?.done) {
    lines.push(FIRST_BOOT_LEFT_TO_XO)
  }
  return lines.join('\n')
}

/**
 * @param {string} description - current description of the VM
 * @param {string} summary - from `describeDocking`
 * @returns {string} the description with the summary of a previous write replaced
 */
export function replaceDockingDescription(description, summary) {
  const markerIndex = description.indexOf(DOCKING_DESCRIPTION_MARKER)
  const ownDescription = (markerIndex === -1 ? description : description.slice(0, markerIndex)).trimEnd()
  return ownDescription === '' ? summary : `${ownDescription}\n\n${summary}`
}
