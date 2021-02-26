const mapValues = require('lodash/mapValues')

const { formatVmBackup } = require('./_formatVmBackup')

// format all backups as returned by RemoteAdapter#listAllVmBackups()
exports.formatVmBackups = function formatVmBackups(backupsByVM) {
  return mapValues(backupsByVM, backups => backups.map(formatVmBackup))
}
