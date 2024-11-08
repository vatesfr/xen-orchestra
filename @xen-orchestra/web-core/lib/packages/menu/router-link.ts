import { BaseItem, type Menu, type MenuLike, parseConfigHolder } from '@core/packages/menu'
import { computed, markRaw, type MaybeRefOrGetter, reactive, toValue } from 'vue'
import { type RouteLocationRaw, RouterLink } from 'vue-router'

export interface MenuRouterLinkConfig {
  to: MaybeRefOrGetter<RouteLocationRaw>
}

export class MenuRouterLinkConfigHolder {
  constructor(public config: MenuRouterLinkConfig) {}
}

export interface MenuRouterLinkProps {
  as: typeof RouterLink
  to: RouteLocationRaw
  onClick: () => void
  onMouseenter: () => void
  'data-menu-id': string
}

export class MenuRouterLink extends BaseItem {
  constructor(
    public menu: Menu,
    public config: MenuRouterLinkConfig
  ) {
    super(menu)
  }

  get props(): MenuRouterLinkProps {
    return reactive({
      as: markRaw(RouterLink),
      onMouseenter: () => this.activate(),
      onClick: () => this.deactivate(),
      to: computed(() => toValue(this.config.to)),
      'data-menu-id': this.menu.context.id,
    })
  }
}

export function routerLink(to: MaybeRefOrGetter<RouteLocationRaw>, config: Omit<MenuRouterLinkConfig, 'to'> = {}) {
  return new MenuRouterLinkConfigHolder({
    ...config,
    to,
  })
}

export function useMenuRouterLink(config: MenuRouterLinkConfig & { parent: MenuLike }) {
  const { parent, to, ...configRest } = config

  return parseConfigHolder(parent, routerLink(to, configRest))
}
