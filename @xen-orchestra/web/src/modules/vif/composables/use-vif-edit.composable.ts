import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useRouter } from 'vue-router'

export function useVifEdit() {
  const router = useRouter()

  function goToVifEdit(vif: FrontXoVif) {
    return router.push({ name: '/vif/[id].edit', params: { id: vif.id } })
  }

  return { goToVifEdit }
}
