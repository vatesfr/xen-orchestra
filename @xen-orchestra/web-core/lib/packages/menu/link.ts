import { BaseItem, type Menu, type MenuLike, parseConfigHolder } from '@core/packages/menu'
import { computed, type MaybeRefOrGetter, reactive, toValue } from 'vue'

export interface MenuLinkConfig {
  href: MaybeRefOrGetter<string>
  rel?: MaybeRefOrGetter<string>
  target?: MaybeRefOrGetter<string>
}

export class MenuLinkConfigHolder {
  constructor(public config: MenuLinkConfig) {}
}

export interface MenuLinkProps {
  as: 'a'
  href: string
  rel: string
  target: string
  onClick: () => void
  onMouseenter: () => void
  'data-menu-id': string
}

export class MenuLink extends BaseItem {
  constructor(
    public menu: Menu,
    public config: MenuLinkConfig
  ) {
    super(menu)
  }

  get props(): MenuLinkProps {
    return reactive({
      as: 'a',
      onMouseenter: () => this.activate(),
      onClick: () => this.deactivate(),
      href: computed(() => toValue(this.config.href)),
      rel: computed(() => toValue(this.config.rel) ?? 'noreferrer noopener'),
      target: computed(() => toValue(this.config.target) ?? '_blank'),
      'data-menu-id': this.menu.context.id,
    })
  }
}

export function link(href: MaybeRefOrGetter<string>, config: Omit<MenuLinkConfig, 'href'> = {}) {
  return new MenuLinkConfigHolder({
    ...config,
    href,
  })
}

export function useMenuLink(config: MenuLinkConfig & { parent: MenuLike }) {
  const { parent, href, ...configRest } = config

  return parseConfigHolder(parent, link(href, configRest))
}
