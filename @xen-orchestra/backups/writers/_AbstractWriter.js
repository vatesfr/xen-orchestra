exports.AbstractWriter = class AbstractWriter {
  constructor({ backup, settings }) {
    this._backup = backup
    this._settings = settings
  }

  beforeBackup() {}

  afterBackup() {}
}
