exports.MixinReplicationWriter = (BaseClass = Object) =>
  class MixinReplicationWriter extends BaseClass {
    constructor({ sr, ...rest }) {
      super(rest)

      this._sr = sr
    }
  }
