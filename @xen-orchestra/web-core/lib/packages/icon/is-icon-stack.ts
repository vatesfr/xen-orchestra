import { type Icon, ICON_SYMBOL, type IconStack } from './types.ts'

export function isIconStack(icon: Icon): icon is IconStack {
  return icon[ICON_SYMBOL] === 'stack'
}
