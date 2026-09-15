import { getVdiFormat, getVdiIcon } from '@/modules/vdi/utils/xo-vdi.util.ts'
import { createVbd } from '@/test/create-vbd.ts'
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
