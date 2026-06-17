import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { RouteLocationAsRelative } from 'vue-router'

export function getVifTrafficRoute(vifId: FrontXoVif['id']): RouteLocationAsRelative {
  return {
    name: '/vif/[id]/general',
    params: { id: vifId },
  }
}
