import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import { useRouter } from 'vue-router'

export function useVifEdit() {
  const router = useRouter()

  function goToVifEdit(vif: XenApiVif) {
    return router.push({ name: '/vif/[uuid]/edit', params: { uuid: vif.uuid } })
  }

  return { goToVifEdit }
}
