import type { Menu } from '@core/modules/menu/type'

export type ItemOption<TItem extends Menu<any>, TValue> = TValue | TValue[] | ((item: TItem) => TValue | TValue[])

export function parseItemOption<TResult, TOption extends ItemOption<any, TResult> = ItemOption<any, TResult>>(
  option: TOption | undefined,
  item: Menu<any>,
  defaultValue: TResult
): TResult | undefined {
  if (typeof option === 'function') {
    return parseItemOption(option(item), item, defaultValue)
  }

  if (Array.isArray(option)) {
    if (item.$level >= option.length) {
      return option[option.length - 1]
    }
    return option[item.$level]
  }

  return (option as TResult) ?? defaultValue
}
