import Plan from './plan.mjs'

// ===================================================================
// Simple plan: only enforces affinity/anti-affinity constraints.
// No threshold-based migrations.
// ===================================================================

export default class SimplePlan extends Plan {
  async execute(): Promise<void> {
    await this._processAffinity()
    await this._processAntiAffinity()
  }
}
