'use strict'

const mapValues = require('lodash/mapValues.js')
const { dirname } = require('path')

function formatVmBackup(backup) {
  return {
    disks:
      backup.vhds === undefined
        ? []
        : Object.keys(backup.vhds).map(vdiId => {
            const vdi = backup.vdis[vdiId]
            return {
              id: `${dirname(backup._filename)}/${backup.vhds[vdiId]}`,
              name: vdi.name_label,
              uuid: vdi.uuid,
            }
          }),

    id: backup.id,
    jobId: backup.jobId,
    mode: backup.mode,
    scheduleId: backup.scheduleId,
    size: backup.size,
    timestamp: backup.timestamp,
    vm: {
      name_description: backup.vm.name_description,
      name_label: backup.vm.name_label,
    },
  }
}

// format all backups as returned by RemoteAdapter#listAllVmBackups()
exports.formatVmBackups = function formatVmBackups(backupsByVM) {
  return mapValues(backupsByVM, backups => backups.map(formatVmBackup))
}
