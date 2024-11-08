import {
  Menu,
  MENU_SYMBOL,
  MenuAction,
  type MenuActionProps,
  MenuActionConfigHolder,
  type MenuLike,
  MenuLink,
  type MenuLinkProps,
  MenuLinkConfigHolder,
  MenuRouterLink,
  type MenuRouterLinkProps,
  MenuRouterLinkConfigHolder,
  type MenuToggleProps,
  MenuToggleConfigHolder,
  MenuToggleTarget,
  MenuToggleTrigger,
} from '@core/packages/menu'
import { type MaybeRefOrGetter, toValue } from 'vue'

export type MenuStructure = {
  [K: string]: ConfigHolder
}

export type ConfigHolder =
  | MenuActionConfigHolder
  | MenuLinkConfigHolder
  | MenuRouterLinkConfigHolder
  | MenuToggleConfigHolder<any>

export type ParseConfigHolder<TConfigHolder extends ConfigHolder> = TConfigHolder extends MenuActionConfigHolder
  ? MenuActionProps
  : TConfigHolder extends MenuLinkConfigHolder
    ? MenuLinkProps
    : TConfigHolder extends MenuRouterLinkConfigHolder
      ? MenuRouterLinkProps
      : TConfigHolder extends MenuToggleConfigHolder<infer TItems>
        ? MenuToggleProps<TItems>
        : never

export type ParseStructure<TStructure extends MenuStructure> = {
  [K in keyof TStructure]: ParseConfigHolder<TStructure[K]>
}

export function parseConfigHolder<TConfigHolder extends ConfigHolder>(
  menuLike: MenuLike,
  configHolder: TConfigHolder
): ParseConfigHolder<TConfigHolder> {
  const menu = menuLike instanceof Menu ? menuLike : menuLike[MENU_SYMBOL]

  if (configHolder instanceof MenuActionConfigHolder) {
    return new MenuAction(menu, configHolder.config).props as ParseConfigHolder<TConfigHolder>
  }

  if (configHolder instanceof MenuLinkConfigHolder) {
    return new MenuLink(menu, configHolder.config).props as ParseConfigHolder<TConfigHolder>
  }

  if (configHolder instanceof MenuRouterLinkConfigHolder) {
    return new MenuRouterLink(menu, configHolder.config).props as ParseConfigHolder<TConfigHolder>
  }

  if (configHolder instanceof MenuToggleConfigHolder) {
    const trigger = new MenuToggleTrigger(menu, configHolder.config)
    const target = new MenuToggleTarget(trigger, configHolder.config)

    return {
      $trigger: trigger.props,
      $target: target.props,
      $isOpen: trigger.isOpen,
      [MENU_SYMBOL]: trigger.subMenu,
      ...parseStructure(trigger.subMenu, configHolder.config.items),
    } as ParseConfigHolder<TConfigHolder>
  }

  throw new Error('Unsupported config')
}

export function parseStructure<TStructure extends MenuStructure>(
  menu: Menu,
  structure: MaybeRefOrGetter<TStructure>
): ParseStructure<TStructure> {
  return Object.fromEntries(
    Object.entries(toValue(structure)).map(([key, configHolder]) => {
      return [key, parseConfigHolder(menu, configHolder)]
    })
  ) as ParseStructure<TStructure>
}
