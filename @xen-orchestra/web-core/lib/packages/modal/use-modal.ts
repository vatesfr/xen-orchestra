import { createModalOpener } from '@core/packages/modal/create-modal-opener.ts'
import { type ModalConfig, type ModalHandlerArgs, type UseModalReturn } from '@core/packages/modal/types.ts'

export function useModal(): ReturnType<typeof createModalOpener>

export function useModal<
  TProps,
  TConfirmArgs extends ModalHandlerArgs<TProps, 'onConfirm'>,
  TCancelArgs extends ModalHandlerArgs<TProps, 'onCancel'>,
  TConfirmPayload = undefined,
  TCancelPayload = undefined,
>(
  config: ModalConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>
): UseModalReturn<[], TConfirmPayload, TCancelPayload>

export function useModal<
  TConfigBuilderArgs extends any[],
  TProps,
  TConfirmArgs extends ModalHandlerArgs<TProps, 'onConfirm'>,
  TCancelArgs extends ModalHandlerArgs<TProps, 'onCancel'>,
  TConfirmPayload = undefined,
  TCancelPayload = undefined,
>(
  configBuilder: (
    ...args: TConfigBuilderArgs
  ) => ModalConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>
): UseModalReturn<TConfigBuilderArgs, TConfirmPayload, TCancelPayload>

export function useModal<
  TConfigBuilderArgs extends any[],
  TProps,
  TConfirmArgs extends ModalHandlerArgs<TProps, 'onConfirm'>,
  TCancelArgs extends ModalHandlerArgs<TProps, 'onCancel'>,
  TConfig extends ModalConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>,
  TConfirmPayload = undefined,
  TCancelPayload = undefined,
>(
  _config?: TConfig | ((...args: TConfigBuilderArgs) => TConfig)
): UseModalReturn<TConfigBuilderArgs, TConfirmPayload, TCancelPayload> | ReturnType<typeof createModalOpener> {
  const openModal = createModalOpener()

  if (_config === undefined) {
    return openModal
  }

  const id = Symbol('modal')

  return (...args: TConfigBuilderArgs) => {
    const config = typeof _config === 'function' ? _config(...args) : _config

    return openModal(id, config)
  }
}
