// import type { RecordId } from '@/types/xo-object.type'
interface MissingPatches {
  nHostsWithMissingPatches: number
  nPoolsWithMissingPatches: number
}

interface DashboardData {
  nPools: number
  nHosts: number
  missingPatches: MissingPatches
}

export type Dashboard = {
  type: 'dashboard'
  DashboardData: DashboardData
}
