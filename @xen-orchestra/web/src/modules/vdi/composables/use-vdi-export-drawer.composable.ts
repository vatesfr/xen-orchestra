import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { downloadVdiContent } from '@/modules/vdi/utils/xo-vdi.util.ts'
import { type VdiExportFormat } from '@/shared/constants.ts'
import { useDrawer } from '@core/packages/drawer/use-drawer.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { type MaybeRefOrGetter } from 'vue'

export function useVdiExportDrawer(rawVdi: MaybeRefOrGetter<FrontXoVdi>) {
  const vdi = toComputed(rawVdi)

  const openDrawer = useDrawer(() => ({
    component: import('@/modules/vdi/components/drawer/VdiExportDrawer.vue'),
    props: {
      vdi: vdi.value,
    },
    onConfirm: async (exportFormat: VdiExportFormat) => {
      downloadVdiContent(vdi.value.id, exportFormat)
    },
  }))

  return { openDrawer }
}
