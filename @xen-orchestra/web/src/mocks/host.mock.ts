import { HOST_POWER_STATE } from '@/types/xo/host.type'
import type { XoHost } from '@/types/xo/host.type'
import type { Branded } from '@core/types/utility.type'

export const runningHost: XoHost = {
  $pool: '' as Branded<'pool'>,
  _xapiRef: '',
  address: '',
  enabled: true,
  id: 'foo' as Branded<'host'>,
  name_description: '',
  name_label: 'Mocked Running Host',
  power_state: HOST_POWER_STATE.RUNNING,
  residentVms: [],
  type: 'host',
}
