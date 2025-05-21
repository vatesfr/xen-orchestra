import { createIconBindings } from './create-icon-bindings.ts'
import { defineIconSingle } from './define-icon-single.ts'
import { mergeIcons } from './merge-icons.ts'
import { type Icon, ICON_SYMBOL, type IconSingleConfig, type IconStack, type IconStackConfig } from './types.ts'

export function defineIconStack(
  icons: IconStack | (IconSingleConfig | Icon)[],
  config: IconStackConfig = {}
): IconStack {
  if (ICON_SYMBOL in icons) {
    return mergeIcons(icons, config)
  }

  return {
    [ICON_SYMBOL]: 'stack',
    config,
    icons: icons.map(icon => (ICON_SYMBOL in icon ? icon : defineIconSingle(icon))),
    bindings: createIconBindings(config),
  }
}
