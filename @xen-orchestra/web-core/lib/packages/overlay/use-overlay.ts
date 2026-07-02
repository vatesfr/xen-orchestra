import { createOverlayOpener } from '@core/packages/overlay/create-overlay-opener'
import { type OverlayConfig, type OverlayHandlerArgs, type UseOverlayReturn } from '@core/packages/overlay/types.ts'

export function useOverlay(): ReturnType<typeof createOverlayOpener>

export function useOverlay<
  TProps,
  TConfirmArgs extends OverlayHandlerArgs<TProps, 'onConfirm'>,
  TCancelArgs extends OverlayHandlerArgs<TProps, 'onCancel'>,
  TConfirmPayload = undefined,
  TCancelPayload = undefined,
>(
  config: OverlayConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>
): UseOverlayReturn<[], TConfirmPayload, TCancelPayload>

export function useOverlay<
  TConfigBuilderArgs extends any[],
  TProps,
  TConfirmArgs extends OverlayHandlerArgs<TProps, 'onConfirm'>,
  TCancelArgs extends OverlayHandlerArgs<TProps, 'onCancel'>,
  TConfirmPayload = undefined,
  TCancelPayload = undefined,
>(
  configBuilder: (
    ...args: TConfigBuilderArgs
  ) => OverlayConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>
): UseOverlayReturn<TConfigBuilderArgs, TConfirmPayload, TCancelPayload>

export function useOverlay<
  TConfigBuilderArgs extends any[],
  TProps,
  TConfirmArgs extends OverlayHandlerArgs<TProps, 'onConfirm'>,
  TCancelArgs extends OverlayHandlerArgs<TProps, 'onCancel'>,
  TConfig extends OverlayConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>,
  TConfirmPayload = undefined,
  TCancelPayload = undefined,
>(
  configOrBuilder?: TConfig | ((...args: TConfigBuilderArgs) => TConfig)
): UseOverlayReturn<TConfigBuilderArgs, TConfirmPayload, TCancelPayload> | ReturnType<typeof createOverlayOpener> {
  const openOverlay = createOverlayOpener()

  if (configOrBuilder === undefined) {
    return openOverlay
  }

  const id = Symbol('overlay')

  return (...args: TConfigBuilderArgs) => {
    const config = typeof configOrBuilder === 'function' ? configOrBuilder(...args) : configOrBuilder

    return openOverlay(id, config)
  }
}
