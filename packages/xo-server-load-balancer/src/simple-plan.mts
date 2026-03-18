import Plan from './plan.mjs'

// ===================================================================

export default class SimplePlan extends Plan {
  async execute(): Promise<void> {
    await this._processAffinity()
    await this._processAntiAffinity()
  }
}
