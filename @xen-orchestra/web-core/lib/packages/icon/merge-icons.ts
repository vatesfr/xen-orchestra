import { defineIconSingle } from './define-icon-single.ts'
import { defineIconStack } from './define-icon-stack.ts'
import { mergeTransforms } from './merge-transforms.ts'
import {
  type Icon,
  ICON_SYMBOL,
  type IconSingle,
  type IconSingleConfig,
  type IconStack,
  type IconStackConfig,
} from './types.ts'

export function mergeIcons<TOriginal extends Icon>(
  original: TOriginal,
  newConfig: TOriginal extends IconSingle ? IconSingleConfig : IconSingleConfig | IconStackConfig
): TOriginal extends IconSingle ? Icon : IconStack {
  if (original[ICON_SYMBOL] === 'stack') {
    return defineIconStack(original.icons, mergeTransforms(original.config, newConfig))
  }

  return defineIconSingle({
    icon: original.config.icon,
    ...mergeTransforms(original.config, newConfig),
  }) as TOriginal extends IconSingle ? Icon : IconStack
}
