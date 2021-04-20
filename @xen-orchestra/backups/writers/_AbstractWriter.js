exports.AbstractWriter = class AbstractWriter {
  constructor({ backup, remoteId, settings, sr }) {
    this._backup = backup
    this._remoteId = remoteId
    this._settings = settings
    this._sr = sr
  }

  beforeBackup() {}
}
