import type { XoPool } from '@/types/xo/pool.type'
import type { Branded } from '@core/types/utility.type'

export type XoVmTemplate = {
  id: Branded<'vm-template'>
  type: 'VM-template'
  $pool: XoPool['id']
  name_label: string
  name_description: string
  template_info: { disks: []; install_methods: string[] }
  VIFs: []
  $VBDs: []
}
