import type { MaybeRef } from '@vueuse/core'
import type { Component, ComputedRef, InjectionKey } from 'vue'

export type DrawerPropsOption<TProps> = {
  [K in keyof TProps]: MaybeRef<TProps[K]>
}

export type MaybePromise<T> = T | Promise<T>

export type AreAllPropsOptional<TProps> = Record<string, never> extends TProps ? true : false

export type RegisteredDrawer = {
  id: symbol | string
  component: Component
  keepOpenOnRouteChange: boolean
  props: object
  isBusy: ComputedRef<boolean>
  onConfirm: (...args: any[]) => void | Promise<void>
  onCancel: (...args: any[]) => void | Promise<void>
}

export type DrawerHandlerArgs<TProps, THandler extends 'onConfirm' | 'onCancel'> = TProps extends {
  [K in THandler]?: (...args: infer TArgs) => any
}
  ? TArgs
  : never

export abstract class AbstractDrawerResponse<TPayload> {
  constructor(public readonly payload: TPayload) {}

  abstract get confirmed(): boolean
  abstract get canceled(): boolean
}

export class DrawerConfirmResponse<TPayload> extends AbstractDrawerResponse<TPayload> {
  public readonly confirmed = true
  public readonly canceled = false
}

export class DrawerCancelResponse<TPayload> extends AbstractDrawerResponse<TPayload> {
  public readonly confirmed = false
  public readonly canceled = true
}

export type DrawerResponse<TConfirmPayload, TCancelPayload> =
  | DrawerConfirmResponse<TConfirmPayload>
  | DrawerCancelResponse<TCancelPayload>

export const ABORT_DRAWER = Symbol('abort drawer')

export type OpenDrawerReturn<TConfirmPayload, TCancelPayload> = Promise<
  DrawerResponse<TConfirmPayload, TCancelPayload>
> & {
  close: () => void
}

export const IK_DRAWER = Symbol('drawer') as InjectionKey<ComputedRef<RegisteredDrawer>>

export type DrawerPropsConfigEntry<TProps> =
  AreAllPropsOptional<TProps> extends true
    ? { props?: DrawerPropsOption<TProps> }
    : { props: DrawerPropsOption<TProps> }

export type DrawerConfig<
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
  onConfirm?: (...args: TConfirmArgs) => MaybePromise<DrawerResponse<TConfirmPayload, any> | TConfirmPayload>
  onCancel?: (...args: TCancelArgs) => MaybePromise<DrawerResponse<TCancelPayload, any> | TCancelPayload>
  keepOpenOnRouteChange?: boolean
} & DrawerPropsConfigEntry<TProps>

export type UseDrawerReturn<TArgs extends any[] = any[], TConfirmPayload = any, TCancelPayload = any> = (
  ...args: TArgs
) => OpenDrawerReturn<TConfirmPayload, TCancelPayload>

export type OpenDrawer = <
  TProps,
  TConfirmArgs extends DrawerHandlerArgs<TProps, 'onConfirm'>,
  TCancelArgs extends DrawerHandlerArgs<TProps, 'onCancel'>,
  TConfirmPayload = undefined,
  TCancelPayload = undefined,
>(
  id: string,
  config: DrawerConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>
) => OpenDrawerReturn<TConfirmPayload, TCancelPayload>
