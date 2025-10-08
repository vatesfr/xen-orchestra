import type { MaybeRef } from '@vueuse/core'
import type { Component, ComputedRef, InjectionKey } from 'vue'

export type ModalPropsOption<TProps> = {
  [K in keyof TProps]: MaybeRef<TProps[K]>
}

export type MaybePromise<T> = T | Promise<T>

export type AreAllPropsOptional<TProps> = Record<string, never> extends TProps ? true : false

export type RegisteredModal = {
  id: symbol | string
  component: Component
  keepOpenOnRouteChange: boolean
  props: object
  isBusy: ComputedRef<boolean>
  onConfirm: (...args: any[]) => void | Promise<void>
  onCancel: (...args: any[]) => void | Promise<void>
}

export type ModalHandlerArgs<TProps, THandler extends 'onConfirm' | 'onCancel'> = TProps extends {
  [K in THandler]?: (...args: infer TArgs) => any
}
  ? TArgs
  : never

export abstract class AbstractModalResponse<TPayload> {
  constructor(public readonly payload: TPayload) {}

  abstract get confirmed(): boolean
  abstract get canceled(): boolean
}

export class ModalConfirmResponse<TPayload> extends AbstractModalResponse<TPayload> {
  public readonly confirmed = true
  public readonly canceled = false
}

export class ModalCancelResponse<TPayload> extends AbstractModalResponse<TPayload> {
  public readonly confirmed = false
  public readonly canceled = true
}

export type ModalResponse<TConfirmPayload, TCancelPayload> =
  | ModalConfirmResponse<TConfirmPayload>
  | ModalCancelResponse<TCancelPayload>

export const ABORT_MODAL = Symbol('abort modal')

export type OpenModalReturn<TConfirmPayload, TCancelPayload> = Promise<
  ModalResponse<TConfirmPayload, TCancelPayload>
> & {
  close: () => void
}

export const IK_MODAL = Symbol('modal') as InjectionKey<ComputedRef<RegisteredModal>>

export type ModalPropsConfigEntry<TProps> =
  AreAllPropsOptional<TProps> extends true ? { props?: ModalPropsOption<TProps> } : { props: ModalPropsOption<TProps> }

export type ModalConfig<
  TProps,
  TConfirmArgs extends any[],
  TCancelArgs extends any[],
  TConfirmPayload,
  TCancelPayload,
> = {
  component: Promise<{
    default: abstract new () => {
      $props: TProps
    }
  }>
  onConfirm?: (...args: TConfirmArgs) => MaybePromise<ModalResponse<TConfirmPayload, any> | TConfirmPayload>
  onCancel?: (...args: TCancelArgs) => MaybePromise<ModalResponse<TCancelPayload, any> | TCancelPayload>
  keepOpenOnRouteChange?: boolean
} & ModalPropsConfigEntry<TProps>

export type UseModalReturn<TArgs extends any[] = any[], TConfirmPayload = any, TCancelPayload = any> = (
  ...args: TArgs
) => OpenModalReturn<TConfirmPayload, TCancelPayload>

export type OpenModal = <
  TProps,
  TConfirmArgs extends ModalHandlerArgs<TProps, 'onConfirm'>,
  TCancelArgs extends ModalHandlerArgs<TProps, 'onCancel'>,
  TConfirmPayload = undefined,
  TCancelPayload = undefined,
>(
  id: string,
  config: ModalConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>
) => OpenModalReturn<TConfirmPayload, TCancelPayload>
