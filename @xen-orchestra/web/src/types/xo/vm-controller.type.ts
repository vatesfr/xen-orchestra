import type { Branded } from '@core/types/utility.type'

export type XoVmController = {
  id: Branded<'vm-controller'>
  memory: {
    dynamic: number[]
    static: number[]
    size: number
  }
}
