import { toVariants } from '@core/utils/to-variants.util.ts'

describe('toVariants', () => {
  it.each([
    {
      label: 'renders a string value as `key--value`',
      variants: { accent: 'brand', size: 'small' },
      expected: ['accent--brand', 'size--small'],
    },
    { label: 'renders a `true` value as the bare key', variants: { disabled: true }, expected: ['disabled'] },
    {
      label: 'drops falsy values',
      variants: { accent: undefined, disabled: false, size: '', count: 0, color: null },
      expected: [],
    },
    { label: 'returns no variant for an empty object', variants: {}, expected: [] },
  ])('$label', ({ variants, expected }) => {
    expect(toVariants(variants)).toEqual(expected)
  })
})
