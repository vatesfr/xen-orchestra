import React from 'react'
import { Dialog, DialogContent, DialogContentText, DialogActions, DialogTitle } from '@material-ui/core'
import { withState } from 'reaclette'

import Button from './Button'
import IntlMessage from './IntlMessage'

interface GeneralParamsModal {
  isSingleButton?: boolean
  message: JSX.Element
  title: JSX.Element
}

interface ParamsModal extends GeneralParamsModal {
  onReject: (reason?: unknown) => void
  onSuccess: (value: string) => void
}

let instance: EffectContext<State, Props, Effects, Computed, ParentState, ParentEffects> | undefined
const modal = ({ isSingleButton = false, message, onReject, onSuccess, title }: ParamsModal) => {
  if (instance === undefined) {
    throw new Error('No modal instance')
  }

  instance.state.isSingleButton = isSingleButton
  instance.state.message = message
  instance.state.onReject = onReject
  instance.state.onSuccess = onSuccess
  instance.state.showModal = true
  instance.state.title = title
}

export const alert = (params: GeneralParamsModal): Promise<string> =>
  new Promise((resolve, reject) => modal({ isSingleButton: true, onReject: reject, onSuccess: resolve, ...params }))

export const confirm = (params: GeneralParamsModal): Promise<string> =>
  new Promise((resolve, reject) => modal({ onReject: reject, onSuccess: resolve, ...params }))

interface ParentState {}

interface State {
  isSingleButton?: boolean
  message?: JSX.Element
  onReject?: () => void
  onSuccess?: (value: string) => void
  showModal: boolean
  title?: JSX.Element
}

interface Props {}

interface ParentEffects {}

interface Effects {
  _closeModal: () => void
  _reject: () => void
  _success: () => void
}

interface Computed {}

const Modal = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      isSingleButton: false,
      message: undefined,
      onReject: undefined,
      onSuccess: undefined,
      showModal: false,
      title: undefined,
    }),
    effects: {
      initialize: function () {
        if (instance !== undefined) {
          throw new Error('Modal is a singelton')
        }
        instance = this
      },
      _closeModal: function () {
        this.state.showModal = false
      },
      _reject: function () {
        this.state.onReject?.()
        this.effects._closeModal()
      },
      _success: function () {
        this.state.onSuccess?.('Success')
        this.effects._closeModal()
      },
    },
  },
  ({ effects, state }) => {
    const { _reject, _success } = effects
    const { isSingleButton, message, showModal, title } = state
    return showModal ? (
      <Dialog open={showModal} onClose={_reject}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          {!isSingleButton && (
            <Button onClick={_reject} color='primary'>
              <IntlMessage id='cancel' />
            </Button>
          )}
          <Button onClick={_success} color='primary'>
            <IntlMessage id='ok' />
          </Button>
        </DialogActions>
      </Dialog>
    ) : null
  }
)

export default Modal
