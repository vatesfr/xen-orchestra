import { Command } from 'commander'

export const generateBase = () => {
  const brand = 'declare const __brand: unique symbol'

  const branded = 'export type Branded<TBrand extends string, TType = string> = TType & { [__brand]: TBrand }'

  const opaqueRefEnum = "export const OPAQUE_REF = { EMPTY: 'OpaqueRef:NULL' } as const"

  const opaqueRefType = "export type OPAQUE_REF_NULL = typeof OPAQUE_REF['EMPTY']"

  return `${brand}\n\n${branded}\n\n${opaqueRefEnum}\n\n${opaqueRefType}\n`
}

const baseCommand = new Command('base').description('Generate base types').action(async () => {
  console.log(generateBase())
})

export { baseCommand }
