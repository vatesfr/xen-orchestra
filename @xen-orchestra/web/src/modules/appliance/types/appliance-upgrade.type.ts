export type ApplianceUpgradePhase = 'snapshot' | 'upgrade'

export type ApplianceUpgrade = {
  phase: ApplianceUpgradePhase
  // absent tant que la tâche d'upgrade n'est pas connue
  start?: number
}
