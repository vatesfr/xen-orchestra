import { formatFilenameDate } from './_filenameDate.mjs'

/**
 * XAPI names of what a live mount of a backed up disk shows the user, so the ones created by the REST
 * API and by a restore read the same.
 *
 * The VDI attached to the host keeps the name of the backed up disk: that is the disk of the VM as
 * the user knows it. The SR says what it is, and which restore point it serves, the same way as a
 * restored VM is named.
 *
 * @param {object} params
 * @param {string} params.vmNameLabel - name of the backed up VM
 * @param {string} params.vdiNameLabel - name of the backed up disk
 * @param {number} params.timestamp - of the restore point, in ms
 * @param {boolean} [params.readWrite] - whether the mount is a live restore rather than a live mount
 * @returns {{ srNameLabel: string, vdiNameLabel: string, vdiNameDescription: string }} - the `xapiLabels` of the live mount mixin
 */
export function liveMountXapiLabels({ vmNameLabel, vdiNameLabel, timestamp, readWrite = false }) {
  const what = readWrite ? 'live restore' : 'live mount'
  const restorePoint = `${vmNameLabel} (${formatFilenameDate(timestamp)})`
  return {
    srNameLabel: `[XO ${what}] ${restorePoint}`,
    vdiNameLabel,
    vdiNameDescription: readWrite
      ? `Live restore of ${restorePoint}: what is written to it is lost on unmount.`
      : `Read-only live mount of ${restorePoint}, removed on unmount.`,
  }
}
