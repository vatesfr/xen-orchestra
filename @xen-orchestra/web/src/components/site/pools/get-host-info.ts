import type { VtsLinkCellProps } from '@core/components/table/cells/VtsLinkCell.vue'
import type { XoHost } from '@vates/types'

export function getHostInfo(host: XoHost | undefined): VtsLinkCellProps & { label: string } {
  return host
    ? { label: host.name_label, to: `/host/${host.id}/dashboard` }
    : { label: '', to: undefined, icon: undefined }
}
