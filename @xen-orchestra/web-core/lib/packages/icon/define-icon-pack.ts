import { defineIcon } from './define-icon.ts'
import { type Icon, ICON_SYMBOL, type IconPack, type IconPackConfig, type IconPackKeys } from './types.ts'

export function defineIconPack<TConfig extends IconPackConfig>(
  config: TConfig
): IconPack<IconPackKeys<NoInfer<TConfig>>> {
  const result: Record<string, Icon> = Object.fromEntries(
    Object.entries(config).flatMap(([key, value]) => {
      if (!(ICON_SYMBOL in value)) {
        return [[key, defineIcon(value)]]
      }

      return value[ICON_SYMBOL] === 'pack'
        ? Object.entries(value).map(([subKey, subValue]) => [`${key}:${subKey}`, subValue])
        : [[key, value as Icon]]
    })
  )

  return {
    ...result,
    [ICON_SYMBOL]: 'pack',
  } as IconPack<IconPackKeys<TConfig>>
}
