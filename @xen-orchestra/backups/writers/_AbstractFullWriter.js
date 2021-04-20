const { AbstractWriter } = require('./_AbstractWriter')

exports.AbstractFullWriter = class AbstractFullWriter extends AbstractWriter {
  constructor(props) {
    super(props)

    this._backup = props.backup
    this._remoteId = props.remoteId
    this._settings = props.settings
    this._sr = props.sr
  }

  run() {
    throw new Error('Not implemented')
  }
}
