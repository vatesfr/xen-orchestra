import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { VdiExportFormat } from '@/shared/constants.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { type IconName, objectIcon } from '@core/icons'
import { downloadFile } from '@core/utils/download-file.utils.ts'

export function getVdiFormat(format: string | undefined): string {
  return format !== undefined ? format.toUpperCase() : 'VHD'
}

export function getVdiIcon(vbds: FrontXoVbd[]): IconName {
  if (vbds.length === 0 || vbds.every(vbd => !vbd.attached)) {
    return objectIcon('vdi', 'detached')
  }

  if (vbds.every(vbd => vbd.attached)) {
    return objectIcon('vdi', 'attached')
  }

  return objectIcon('vdi', 'warning')
}

export function downloadVdiContent(vdiId: string, exportFormat: VdiExportFormat) {
  const url = `${BASE_URL}/vdis/${vdiId}.${exportFormat}`
  const fileName = `${vdiId}.${exportFormat}`
  downloadFile(url, fileName)
}
