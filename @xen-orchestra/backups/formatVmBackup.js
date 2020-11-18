const { dirname } = require('path')

exports.formatVmBackup = (remoteId, backup) => {
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

    // inject an id usable by importVmBackupNg()
    id: `${remoteId}/${backup._filename}`,
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
