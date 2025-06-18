import { defineIconSingle } from './define-icon-single.ts'
import { defineIconStack } from './define-icon-stack.ts'
import { generateIconVariants } from './generate-icon-variants.ts'
import {
  type DefineIconConfig,
  type Icon,
  ICON_SYMBOL,
  type IconArgsToNames,
  type IconPack,
  type IconStackConfig,
  type ArgsConfigToBuilderArgs,
} from './types.ts'

type ArgsValue = string[][]

export function defineIcon(configOrIcons: DefineIconConfig, stackConfig?: IconStackConfig): Icon

export function defineIcon<
  const TArgsConfig extends ArgsValue,
  TArgs extends ArgsConfigToBuilderArgs<TArgsConfig>,
  TNames extends IconArgsToNames<TArgs>,
>(args: TArgsConfig, builder: (...args: TArgs) => DefineIconConfig, stackConfig?: IconStackConfig): IconPack<TNames>

export function defineIcon(
  configOrIconsOrArgs: DefineIconConfig | ArgsValue,
  stackConfigOrBuilder?: IconStackConfig | ((...args: string[]) => DefineIconConfig),
  stackConfigOrNone?: IconStackConfig
): Icon | IconPack<any> {
  if (typeof stackConfigOrBuilder === 'function') {
    return generateIconVariants(configOrIconsOrArgs as ArgsValue, stackConfigOrBuilder, stackConfigOrNone)
  }

  const configOrIcons = configOrIconsOrArgs as DefineIconConfig

  if (Array.isArray(configOrIcons) || ICON_SYMBOL in configOrIcons) {
    return defineIconStack(configOrIcons, stackConfigOrBuilder)
  }

  return defineIconSingle(configOrIcons)
}
