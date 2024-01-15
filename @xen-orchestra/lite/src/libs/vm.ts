import { saveAs } from 'file-saver'
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'

function stringifyCsvValue(value: any) {
  let res = ''
  if (Array.isArray(value)) {
    res = value.join(';')
  } else if (typeof value === 'object') {
    res = JSON.stringify(value)
  } else {
    res = String(value)
  }
  return `"${res.replace(/"/g, '""')}"`
}

export function exportVmsAsCsvFile(vms: XenApiVm[], fileName: string) {
  const csvHeaders = Object.keys(vms[0])

  const csvRows = vms.map(vm => csvHeaders.map(header => stringifyCsvValue(vm[header as keyof XenApiVm])))

  saveAs(
    new Blob([[csvHeaders, ...csvRows].map(row => row.join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8',
    }),
    fileName
  )
}

export function exportVmsAsJsonFile(vms: XenApiVm[], fileName: string) {
  saveAs(
    new Blob([JSON.stringify(vms, null, 2)], {
      type: 'application/json',
    }),
    fileName
  )
}
