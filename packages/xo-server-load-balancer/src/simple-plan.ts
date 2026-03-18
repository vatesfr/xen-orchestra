import Plan from './plan.js'

// ===================================================================

export default class SimplePlan extends Plan {
  async _doExecute(): Promise<void> {
    await this._processAffinity()
    await this._processAntiAffinity()
  }
}
