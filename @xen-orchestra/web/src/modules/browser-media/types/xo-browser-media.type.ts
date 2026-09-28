import type { XoVm } from '@vates/types'

export type XoBrowserMediaStatus = 'waiting-for-browser' | 'connected' | 'attached' | 'disconnected'

export type XoBrowserMedia = {
  id: string
  vmId: XoVm['id']
  name: string
  size: number
  status: XoBrowserMediaStatus
}

export type XoBrowserMediaCreated = {
  id: XoBrowserMedia['id']
  // WebSocket path, usable once, from which the browser serves the ISO
  socket: string
}
