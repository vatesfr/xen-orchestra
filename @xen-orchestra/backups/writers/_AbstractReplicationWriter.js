exports.AbstractReplicationWriter = (BaseClass = Object) =>
  class AbstractReplicationWriter extends BaseClass {
    constructor({ sr, ...rest }) {
      super(rest)

      this._sr = sr
    }
  }
