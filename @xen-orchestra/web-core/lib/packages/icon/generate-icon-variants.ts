import { defineIconPack } from './define-icon-pack.ts'
import { defineIcon } from './define-icon.ts'
import { type DefineIconConfig, type IconPack, type IconStackConfig } from './types.ts'

export function generateIconVariants<TArgs extends string[][]>(
  argsConfigs: TArgs,
  setup: (...args: any[]) => DefineIconConfig,
  stackConfig: IconStackConfig | undefined
): IconPack<any> {
  const argsCombinations = argsConfigs.reduce((acc, arr) => acc.flatMap(prefix => arr.map(item => [...prefix, item])), [
    [],
  ] as string[][])

  return defineIconPack(
    Object.fromEntries(argsCombinations.map(args => [args.join(':'), defineIcon(setup(...args), stackConfig)]))
  )
}
