export default class Vms {
  constructor(xo) {
    this._xo = xo
  }

  async revertVm({ snapshot, snapshotBefore, userId }) {
    const { _xo } = this
    const snapshotXapi = _xo.getXapi(snapshot)
    const { $id: snapshotId } = await snapshotXapi.revertVm(
      snapshot._xapiId,
      snapshotBefore
    )
    if (
      snapshotId !== undefined &&
      (await _xo.getUser(userId)).permission !== 'admin'
    ) {
      await _xo.addAcl(userId, snapshotId, 'admin')
    }
  }
}
