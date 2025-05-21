import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import type { SimpleIcon } from 'simple-icons'

export const ICON_SYMBOL = Symbol('Icon')

export type IconTransforms = {
  borderColor?: string
  translate?: number | [number, number]
  size?: number | [number, number]
  rotate?: number
  flip?: 'horizontal' | 'vertical' | 'both'
  color?: string
}

export type IconSingleConfig = {
  icon?: IconDefinition | SimpleIcon | IconSingle | IconStack
} & IconTransforms

export type IconStackConfig = IconTransforms

export type IconBindings = {
  style?: {
    color?: string
    rotate?: string
    translate?: string
    scale?: string
  }
}

export type IconSingle = NormalizedIcon & {
  [ICON_SYMBOL]: 'icon'
  config: IconSingleConfig
  bindings: IconBindings
}

export type IconStack = {
  [ICON_SYMBOL]: 'stack'
  icons: Icon[]
  config: IconStackConfig
  bindings: IconBindings
}

export type Icon = IconSingle | IconStack

export type IconPackKeys<TConfig extends object> = keyof {
  [K in keyof TConfig as TConfig[K] extends IconPack<infer TKey> ? `${K & string}:${TKey}` : K]: true
}

export type IconPackConfig = Record<string, Icon | IconPack<string> | DefineIconConfig>

export type IconPack<TKeys extends string> = {
  [ICON_SYMBOL]: 'pack'
} & {
  [K in TKeys]: Icon
}

export type ArgsConfigToBuilderArgs<T extends string[][]> = {
  [K in keyof T]: T[K][number]
}

export type IconArgsToNames<TArgs extends any[]> = TArgs extends [infer TFirst, ...infer TRest]
  ? TRest extends []
    ? TFirst
    : `${TFirst & string}:${IconArgsToNames<TRest>}`
  : never

export type DefineIconConfig = IconSingleConfig | IconStack | (IconSingleConfig | IconStack)[]

export type NormalizedIcon = {
  viewBox: string
  paths: string[]
}
