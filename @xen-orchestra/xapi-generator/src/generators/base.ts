import { Command } from 'commander'

export const generateBase = () => {
  const brand = 'declare const __brand: unique symbol'

  const branded = 'export type Branded<TBrand extends string, TType = string> = TType & { [__brand]: TBrand }'

  return `${brand}\n\n${branded}\n`
}

const baseCommand = new Command('base').description('Generate base types').action(async () => {
  console.log(generateBase())
})

export { baseCommand }
