import React from 'react'
import { FormattedMessage } from 'react-intl'
import { withState } from 'reaclette'

import Button from './Button'

interface GeneralPropsModal {
  message: JSX.Element
  title: JSX.Element
}

interface PropsModal extends GeneralPropsModal {
  onReject: (reason: unknown) => void
  onSuccess: (value: unknown) => void
}

export const confirm = ({ message, title }: GeneralPropsModal) =>
  new Promise((resolve, reject) => modal({ message, onReject: reject, onSuccess: resolve, title }))

const modal = ({ message, onReject, onSuccess, title }: PropsModal) => {
  if (instance === undefined) {
    throw new Error('No modal instance')
  }

  instance.state.message = message
  instance.state.onReject = onReject
  instance.state.onSuccess = onSuccess
  instance.state.showModal = true
  instance.state.title = title
}

const STYLES_MODAL: React.CSSProperties = {
  backgroundColor: 'lightgrey',
  border: '1px solid black',
  left: '50%',
  position: 'absolute',
  top: '20%',
  transform: 'translate(-50%,-50%)',
}

interface ParentState {}

interface State {
  message?: JSX.Element
  onReject?: (reason: unknown) => void
  onSuccess?: (value: unknown) => void
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

let instance: EffectContext<State, Props, Effects, Computed, ParentState, ParentEffects> | undefined
const Modal = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
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
      finalize: function () {
        instance = undefined
      },
      _closeModal: function () {
        this.state.showModal = false
      },
      _reject: function () {
        this.state.onReject!('Normal reject')
        this.effects._closeModal()
      },
      _success: function () {
        this.state!.onSuccess!('Success')
        this.effects._closeModal()
      },
    },
  },
  ({ effects, state }) => {
    const { _reject, _success } = effects
    const { message, showModal, title } = state
    return showModal ? (
      <div style={STYLES_MODAL}>
        <p>{title}</p>
        <p>{message}</p>
        <footer>
          <Button onClick={_success}>
            <FormattedMessage id='ok' />
          </Button>
          <Button onClick={_reject}>
            <FormattedMessage id='cancel' />
          </Button>
        </footer>
      </div>
    ) : null
  }
)

export default Modal
