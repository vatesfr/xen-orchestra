const { AbstractWriter } = require('./_AbstractWriter')

exports.AbstractDeltaWriter = class AbstractDeltaWriter extends AbstractWriter {
  constructor(props) {
    super(props)

    this._backup = props.backup
    this._remoteId = props.remoteId
    this._settings = props.settings
    this._sr = props.sr
  }

  checkBaseVdis() {
    throw new Error('Not implemented')
  }

  cleanup() {
    throw new Error('Not implemented')
  }

  prepare() {
    throw new Error('Not implemented')
  }

  transfer() {
    throw new Error('Not implemented')
  }
}
