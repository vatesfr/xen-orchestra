import { createDrawerOpener } from '@core/packages/drawer/create-drawer-opener.ts'
import { type DrawerConfig, type DrawerHandlerArgs, type UseDrawerReturn } from '@core/packages/drawer/types.ts'

export function useDrawer(): ReturnType<typeof createDrawerOpener>

export function useDrawer<
  TProps,
  TConfirmArgs extends DrawerHandlerArgs<TProps, 'onConfirm'>,
  TCancelArgs extends DrawerHandlerArgs<TProps, 'onCancel'>,
  TConfirmPayload = undefined,
  TCancelPayload = undefined,
>(
  config: DrawerConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>
): UseDrawerReturn<[], TConfirmPayload, TCancelPayload>

export function useDrawer<
  TConfigBuilderArgs extends any[],
  TProps,
  TConfirmArgs extends DrawerHandlerArgs<TProps, 'onConfirm'>,
  TCancelArgs extends DrawerHandlerArgs<TProps, 'onCancel'>,
  TConfirmPayload = undefined,
  TCancelPayload = undefined,
>(
  configBuilder: (
    ...args: TConfigBuilderArgs
  ) => DrawerConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>
): UseDrawerReturn<TConfigBuilderArgs, TConfirmPayload, TCancelPayload>

export function useDrawer<
  TConfigBuilderArgs extends any[],
  TProps,
  TConfirmArgs extends DrawerHandlerArgs<TProps, 'onConfirm'>,
  TCancelArgs extends DrawerHandlerArgs<TProps, 'onCancel'>,
  TConfig extends DrawerConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>,
  TConfirmPayload = undefined,
  TCancelPayload = undefined,
>(
  configOrBuilder?: TConfig | ((...args: TConfigBuilderArgs) => TConfig)
): UseDrawerReturn<TConfigBuilderArgs, TConfirmPayload, TCancelPayload> | ReturnType<typeof createDrawerOpener> {
  const openDrawer = createDrawerOpener()

  if (configOrBuilder === undefined) {
    return openDrawer
  }

  const id = Symbol('drawer')

  return (...args: TConfigBuilderArgs) => {
    const config = typeof configOrBuilder === 'function' ? configOrBuilder(...args) : configOrBuilder

    return openDrawer(id, config)
  }
}
