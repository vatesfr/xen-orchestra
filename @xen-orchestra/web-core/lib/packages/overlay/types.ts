import type { KEEP_OVERLAY_OPEN, OVERLAY_ABORT_EVENT } from '@core/packages/overlay/symbols.ts'
import type { Component } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'

export type Prettify<T> = T extends infer R ? { [K in keyof R]: R[K] } & NonNullable<unknown> : never

export type OverlayEvents<TComponent extends Component> = {
  [TKey in ComponentEmitName<TComponent>]?:
    | true
    | ((...args: ExtractHandlerArgs<ComponentProps<TComponent>[TKey]>) => unknown)
}

// Generic inference skips excess property checks, so unknown event keys are
// forced to `never` to be rejected at the call site
export type ForbidExtraEvents<TComponent extends Component, TEvents> = Record<
  Exclude<keyof TEvents, ComponentEmitName<TComponent>>,
  never
>

export type OpenEvents<TComponent extends Component, TEvents extends OverlayEvents<TComponent>> = {
  [TKey in ComponentEmitName<TComponent>]?: TKey extends keyof TEvents
    ? (payload: ExtractHandlerPayload<TEvents[TKey]>) => unknown
    : ComponentProps<TComponent>[TKey]
}

export type ResolvedPayload<TValue> = Exclude<Awaited<TValue>, typeof KEEP_OVERLAY_OPEN>

export type ExtractHandlerPayload<THandler> = THandler extends (...args: never) => infer TReturn
  ? ResolvedPayload<TReturn>
  : THandler extends true
    ? undefined
    : never

export type ExtractOverlayResponse<
  TComponent extends Component,
  TEvents extends OverlayEvents<TComponent>,
  TOpenEvents extends OpenEvents<TComponent, TEvents>,
> =
  | Prettify<
      {
        [TKey in RequiredKeys<TOpenEvents>]: OverlayResponse<
          TKey,
          ExtractHandlerPayload<TOpenEvents[TKey & keyof TOpenEvents]>
        >
      }[RequiredKeys<TOpenEvents>]
    >
  | Prettify<
      {
        [TKey in Exclude<keyof TEvents, RequiredKeys<TOpenEvents>>]: OverlayResponse<
          TKey,
          ExtractHandlerPayload<TEvents[TKey]>
        >
      }[Exclude<keyof TEvents, RequiredKeys<TOpenEvents>>]
    >
  | OverlayResponse<typeof OVERLAY_ABORT_EVENT, undefined>

export type OverlayStatus = 'idle' | 'locked' | 'busy' | 'settled'

export interface Overlay {
  key: symbol
  component: Component
  props: Record<string, unknown>
  status: OverlayStatus
  lastTrigger: symbol | undefined
}

export type ExtractEventName<TName> = TName extends `onVnode${string}`
  ? never
  : TName extends `on${Capitalize<string>}`
    ? TName
    : never

export type ExtractHandlerArgs<THandler> = THandler extends (...args: infer TArgs) => unknown ? TArgs : never

export type ComponentEmitName<TComponent extends Component> = ExtractEventName<
  keyof Required<ComponentProps<TComponent>>
>

export type RequiredKeys<TObject> = {
  [TKey in keyof TObject]-?: NonNullable<unknown> extends Pick<TObject, TKey> ? never : TKey
}[keyof TObject]

export type OverlayEventHandler = (...args: unknown[]) => unknown

export interface OverlayResponse<TEvent extends PropertyKey, TPayload> {
  event: TEvent
  payload: TPayload
}

export type MaybeOptionalArgs<TObject extends object> =
  Partial<TObject> extends TObject ? [arg?: TObject] : [arg: TObject]

export type MaybeOptionalKey<TKey extends PropertyKey, TObject extends object> =
  Partial<TObject> extends TObject ? { [P in TKey]?: TObject } : { [P in TKey]: TObject }
