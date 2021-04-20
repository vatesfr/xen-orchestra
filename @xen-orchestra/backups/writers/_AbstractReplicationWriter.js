exports.AbstractReplicationWriter = (BaseClass = Object) =>
  class AbstractReplicationWriter extends BaseClass {
    constructor(props) {
      super(props)

      this._backup = props.backup
      this._settings = props.settings
      this._sr = props.sr
    }
  }
