import type { InputWrapperController } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { MobileMenuController } from '@core/components/menu/VtsMobileMenu.vue'
import type { PanelActionsGroup } from '@core/components/panel/PanelActions.vue'
import type { InfoSize } from '@core/components/ui/info/UiInfo.vue'
import type { ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import type { TreeItemLabelSize } from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import type { ValueFormatter } from '@core/types/chart.ts'
import type { ComputedRef, InjectionKey, Ref } from 'vue'

export const IK_CHART_VALUE_FORMATTER = Symbol('IK_CHART_VALUE_FORMATTER') as InjectionKey<ComputedRef<ValueFormatter>>

export const IK_TREE_ITEM_HAS_CHILDREN = Symbol('IK_TREE_ITEM_HAS_CHILDREN') as InjectionKey<Ref<boolean>>

export const IK_TREE_ITEM_TOGGLE = Symbol('IK_TREE_ITEM_TOGGLE') as InjectionKey<(force?: boolean) => void>

export const IK_TREE_ITEM_EXPANDED = Symbol('IK_TREE_ITEM_EXPANDED') as InjectionKey<Ref<boolean>>

export const IK_TREE_LIST_DEPTH = Symbol('IK_TREE_LIST_DEPTH') as InjectionKey<Ref<number>>

export const IK_TREE_ITEM_LABEL_SIZE = Symbol('IK_TREE_ITEM_LABEL_SIZE') as InjectionKey<TreeItemLabelSize>

export const IK_MENU_HORIZONTAL = Symbol('IK_MENU_HORIZONTAL') as InjectionKey<ComputedRef<boolean>>

export const IK_CLOSE_MENU = Symbol('IK_CLOSE_MENU') as InjectionKey<() => void>

export const IK_IN_MENU = Symbol('IK_IN_MENU') as InjectionKey<boolean>

export const IK_MENU_PLACEMENT_SIDE = Symbol('IK_MENU_PLACEMENT_SIDE') as InjectionKey<Ref<string | undefined>>

export const IK_MOBILE_MENU = Symbol('IK_MOBILE_MENU') as InjectionKey<MobileMenuController>

export const IK_MENU_ACTION_HANDLER = Symbol('IK_MENU_ACTION_HANDLER') as InjectionKey<() => void>

export const IK_PANEL_ACTIONS_COMPACT = Symbol('IK_PANEL_ACTIONS_COMPACT') as InjectionKey<ComputedRef<boolean>>

export const IK_PANEL_ACTIONS = Symbol('IK_PANEL_ACTIONS') as InjectionKey<PanelActionsGroup>

export const IK_DISABLED = Symbol('IK_DISABLED') as InjectionKey<ComputedRef<boolean>>

export const IK_INPUT_WRAPPER_CONTROLLER = Symbol('IK_INPUT_WRAPPER_CONTROLLER') as InjectionKey<InputWrapperController>

export const IK_OVERLAY_ACCENT = Symbol('IK_OVERLAY_ACCENT') as InjectionKey<ComputedRef<ModalAccent>>

export const IK_INFO_SIZE = Symbol('IK_INFO_SIZE') as InjectionKey<InfoSize>
