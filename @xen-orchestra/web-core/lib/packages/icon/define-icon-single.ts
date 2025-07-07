import { createIconBindings } from './create-icon-bindings.ts'
import { mergeIcons } from './merge-icons.ts'
import { normalizeIcon } from './normalize-icon.ts'
import { type Icon, ICON_SYMBOL, type IconSingleConfig } from './types.ts'

export function defineIconSingle(config: IconSingleConfig): Icon {
  if (config.icon !== undefined && ICON_SYMBOL in config.icon) {
    return mergeIcons(config.icon, config)
  }

  return {
    [ICON_SYMBOL]: 'icon',
    ...normalizeIcon(config.icon),
    config,
    bindings: createIconBindings(config),
  }
}
