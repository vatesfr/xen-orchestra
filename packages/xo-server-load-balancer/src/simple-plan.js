import Plan from './plan'

// ===================================================================

export default class SimplePlan extends Plan {
  async execute() {
    await this._processVmToHostAffinity()
    await this._processAffinity()
    await this._processAntiAffinity()
  }
}
