export interface CreateNetworkBody {
  name: string
  description?: string
  pif: string
  /**
   * @default 1500
   */
  mtu?: number
  /**
   * @minimum 0 vlan must be between 0 and 4094
   * @maximum 4094 vlan must be between 0 and 4094
   */
  vlan: number
}
