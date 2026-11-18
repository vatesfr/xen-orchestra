import { toVariants } from '@core/utils/to-variants.util.ts'

describe('toVariants', () => {
  it('renders a string value as `key--value`', () => {
    expect(toVariants({ accent: 'brand', size: 'small' })).toEqual(['accent--brand', 'size--small'])
  })

  it('renders a `true` value as the bare key', () => {
    expect(toVariants({ disabled: true })).toEqual(['disabled'])
  })

  it('drops falsy values', () => {
    expect(toVariants({ accent: undefined, disabled: false, size: '' })).toEqual([])
  })
})
