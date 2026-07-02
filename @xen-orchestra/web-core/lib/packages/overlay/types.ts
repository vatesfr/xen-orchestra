import type { Component, ComputedRef, InjectionKey, MaybeRef } from 'vue'

export type OverlayPropsOption<TProps> = {
  [K in keyof TProps]: MaybeRef<TProps[K]>
}

export type MaybePromise<T> = T | Promise<T>

export type AreAllPropsOptional<TProps> = Record<string, never> extends TProps ? true : false

export type RegisteredOverlay = {
  id: symbol | string
  component: Component
  keepOpenOnRouteChange: boolean
  props: object
  isBusy: ComputedRef<boolean>
  onConfirm: (...args: any[]) => void | Promise<void>
  onCancel: (...args: any[]) => void | Promise<void>
}

export type OverlayHandlerArgs<TProps, THandler extends 'onConfirm' | 'onCancel'> = TProps extends {
  [K in THandler]?: (...args: infer TArgs) => any
}
  ? TArgs
  : never

export type OverlayResponseStatus = 'confirmed' | 'canceled' | 'aborted'

export abstract class AbstractOverlayResponse<TPayload> {
  constructor(public readonly payload: TPayload) {}

  abstract get status(): OverlayResponseStatus
}

export class OverlayConfirmResponse<TPayload> extends AbstractOverlayResponse<TPayload> {
  public readonly status = 'confirmed'
}

export class OverlayCancelResponse<TPayload> extends AbstractOverlayResponse<TPayload> {
  public readonly status = 'canceled'
}

export class OverlayAbortResponse extends AbstractOverlayResponse<undefined> {
  public readonly status = 'aborted'

  constructor() {
    super(undefined)
  }
}

export type OverlayResponse<TConfirmPayload, TCancelPayload> =
  | OverlayConfirmResponse<TConfirmPayload>
  | OverlayCancelResponse<TCancelPayload>
  | OverlayAbortResponse

export type OverlayHandlerReturn<TPayload> = MaybePromise<
  OverlayConfirmResponse<TPayload> | OverlayCancelResponse<unknown> | typeof KEEP_OVERLAY_OPEN | TPayload
>

export const KEEP_OVERLAY_OPEN = Symbol('keep overlay open')

export type OpenOverlayReturn<TConfirmPayload, TCancelPayload> = Promise<
  OverlayResponse<TConfirmPayload, TCancelPayload>
> & {
  abort: () => void
}

export const IK_OVERLAY = Symbol('overlay') as InjectionKey<ComputedRef<RegisteredOverlay>>

export type OverlayPropsConfigEntry<TProps> =
  AreAllPropsOptional<TProps> extends true
    ? { props?: OverlayPropsOption<TProps> }
    : { props: OverlayPropsOption<TProps> }

export type OverlayConfig<
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
  onConfirm?: (...args: TConfirmArgs) => OverlayHandlerReturn<TConfirmPayload>
  onCancel?: (...args: TCancelArgs) => OverlayHandlerReturn<TCancelPayload>
  keepOpenOnRouteChange?: boolean
} & OverlayPropsConfigEntry<TProps>

export type UseOverlayReturn<TArgs extends any[] = any[], TConfirmPayload = any, TCancelPayload = any> = (
  ...args: TArgs
) => OpenOverlayReturn<TConfirmPayload, TCancelPayload>

export type OpenOverlay = <
  TProps,
  TConfirmArgs extends OverlayHandlerArgs<TProps, 'onConfirm'>,
  TCancelArgs extends OverlayHandlerArgs<TProps, 'onCancel'>,
  TConfirmPayload = undefined,
  TCancelPayload = undefined,
>(
  id: string,
  config: OverlayConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>
) => OpenOverlayReturn<TConfirmPayload, TCancelPayload>
