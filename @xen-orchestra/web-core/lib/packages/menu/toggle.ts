import {
  Menu,
  MenuContext,
  type MenuLike,
  type MenuStructure,
  type MenuToggleTargetConfig,
  type MenuToggleTargetProps,
  type MenuToggleTriggerConfig,
  type MenuToggleTriggerProps,
  parseConfigHolder,
  type ParseStructure,
  type WithMenu,
} from '@core/packages/menu'
import { computed, type ComputedRef, type MaybeRefOrGetter } from 'vue'

export type MenuToggleConfig<TStructure extends MenuStructure> = MenuToggleTriggerConfig &
  MenuToggleTargetConfig & {
    items?: MaybeRefOrGetter<TStructure>
  }

export class MenuToggleConfigHolder<TStructure extends MenuStructure> {
  constructor(public config: MenuToggleConfig<TStructure>) {}
}

export type MenuToggleProps<TStructure extends MenuStructure> = WithMenu &
  ParseStructure<TStructure> & {
    $trigger: MenuToggleTriggerProps
    $target: MenuToggleTargetProps
    $isOpen: ComputedRef<boolean>
  }

export function toggle<const TStructure extends MenuStructure>(config: MenuToggleConfig<TStructure>) {
  return new MenuToggleConfigHolder(config)
}

export function useMenuToggle<const TStructure extends MenuStructure>(
  config: MenuToggleConfig<TStructure> & { parent?: MenuLike } = {}
) {
  const { parent, ...toggleConfig } = config
  const menu = parent ?? new Menu(new MenuContext())

  return computed(() => parseConfigHolder(menu, toggle<TStructure>(toggleConfig)))
}
