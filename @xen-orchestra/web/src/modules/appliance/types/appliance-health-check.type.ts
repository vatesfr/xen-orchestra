export type ApplianceHealthCheckStatus = 'success' | 'warning' | 'danger'

export type ApplianceHealthCheckItem = {
  name: string
  status: ApplianceHealthCheckStatus
  detail?: string
}
