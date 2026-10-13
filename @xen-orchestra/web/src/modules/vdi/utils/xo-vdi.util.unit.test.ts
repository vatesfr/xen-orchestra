import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { compareVdiUsages, getVdiFormat, getVdiIcon } from '@/modules/vdi/utils/xo-vdi.util.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { objectIcon } from '@core/icons'

describe('getVdiFormat', () => {
  it('uppercases the given format', () => {
    expect(getVdiFormat('raw')).toBe('RAW')
  })

  it('defaults to VHD when the format is undefined', () => {
    expect(getVdiFormat(undefined)).toBe('VHD')
  })
})

describe('getVdiIcon', () => {
  it('returns the detached icon when there are no VBDs', () => {
    expect(getVdiIcon([])).toBe(objectIcon('vdi', 'detached'))
  })

  it('returns the detached icon when every VBD is detached', () => {
    expect(getVdiIcon([createVbd({ attached: false }), createVbd({ attached: false })])).toBe(
      objectIcon('vdi', 'detached')
    )
  })

  it('returns the attached icon when every VBD is attached', () => {
    expect(getVdiIcon([createVbd({ attached: true }), createVbd({ attached: true })])).toBe(
      objectIcon('vdi', 'attached')
    )
  })

  it('returns the warning icon when some VBDs are attached and some are not', () => {
    expect(getVdiIcon([createVbd({ attached: true }), createVbd({ attached: false })])).toBe(
      objectIcon('vdi', 'warning')
    )
  })
})

describe('compareVdiUsages', () => {
  function sortVdiLabels(vdis: FrontXoVdi[]) {
    return [...vdis].sort(compareVdiUsages).map(vdi => vdi.name_label)
  }

  it('orders VDIs by used space percentage rather than absolute usage', () => {
    const vdis = [
      createVdi({ name_label: 'Small VDI', usage: 9, size: 10 }),
      createVdi({ name_label: 'Big VDI', usage: 500, size: 1000 }),
    ]

    expect(sortVdiLabels(vdis)).toEqual(['Big VDI', 'Small VDI'])
  })

  it('treats a VDI with no size as 0% used', () => {
    const vdis = [
      createVdi({ name_label: 'Used VDI', usage: 10, size: 100 }),
      createVdi({ name_label: 'Empty VDI', usage: 0, size: 0 }),
    ]

    expect(sortVdiLabels(vdis)).toEqual(['Empty VDI', 'Used VDI'])
  })
})
