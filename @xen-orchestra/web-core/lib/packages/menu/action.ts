import { BaseItem, type Menu, type MenuLike, parseConfigHolder } from '@core/packages/menu'
import { computed, type MaybeRefOrGetter, reactive, ref, toValue } from 'vue'

export interface MenuActionConfig {
  handler: () => any
  disabled?: MaybeRefOrGetter<boolean | string | undefined>
  busy?: MaybeRefOrGetter<boolean | string | undefined>
}

export class MenuActionConfigHolder {
  constructor(public config: MenuActionConfig) {}
}

export interface MenuActionProps {
  as: 'button'
  type: 'button'
  disabled: boolean
  busy: boolean
  tooltip: string | false
  onClick: () => void
  onMouseenter: () => void
  'data-menu-id': string
}

export class MenuAction extends BaseItem {
  isRunning = ref(false)

  constructor(
    public menu: Menu,
    public config: MenuActionConfig
  ) {
    super(menu)
  }

  get busyConfig() {
    return computed(() => toValue(this.config.busy) ?? false)
  }

  get isBusy() {
    return computed(() => this.isRunning.value || this.busyConfig.value !== false)
  }

  get busyReason() {
    return computed(() => (typeof this.busyConfig.value === 'string' ? this.busyConfig.value : undefined))
  }

  get disabledConfig() {
    return computed(() => toValue(this.config.disabled) ?? false)
  }

  get isDisabled() {
    return computed(() => this.isBusy.value || this.disabledConfig.value !== false)
  }

  get disabledReason() {
    return computed(() => (typeof this.disabledConfig.value === 'string' ? this.disabledConfig.value : undefined))
  }

  get tooltip() {
    return computed(() => this.disabledReason.value ?? this.busyReason.value ?? false)
  }

  get props(): MenuActionProps {
    return reactive({
      as: 'button',
      type: 'button',
      onClick: async () => {
        if (this.isDisabled.value) {
          return
        }

        this.isRunning.value = true

        try {
          await this.config.handler()
          this.deactivate()
        } finally {
          this.isRunning.value = false
        }
      },
      onMouseenter: () => this.activate(),
      disabled: this.isDisabled,
      busy: this.isBusy,
      tooltip: this.tooltip,
      'data-menu-id': this.menu.context.id,
    })
  }
}

export function action(handler: () => void, config: Omit<MenuActionConfig, 'handler'> = {}): MenuActionConfigHolder {
  return new MenuActionConfigHolder({
    ...config,
    handler,
  })
}

export function useMenuAction(config: MenuActionConfig & { parent: MenuLike }) {
  const { parent, handler, ...configRest } = config

  return parseConfigHolder(parent, action(handler, configRest))
}
