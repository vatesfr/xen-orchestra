import Plan from './plan'

// ===================================================================

export default class SimplePlan extends Plan {
  async execute() {
    await this._processAntiAffinity()
  }
}
