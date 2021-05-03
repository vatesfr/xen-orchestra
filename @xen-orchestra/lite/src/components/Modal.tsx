import React from 'react'
import { forEach } from 'lodash'
import { FormattedMessage } from 'react-intl'
import { withState } from 'reaclette'

interface GeneralPropsModal {
  [key: string]: JSX.Element | { (arg: unknown): void }
  message: JSX.Element
  title: JSX.Element
}

interface PropsModal extends GeneralPropsModal {
  onReject: (reason: unknown) => void
  onSuccess: (value: unknown) => void
}

export const confirm = ({ message, title }: GeneralPropsModal) =>
  new Promise((resolve, reject) => modal({ message, onReject: reject, onSuccess: resolve, title }))

const modal = (args: PropsModal) => {
  if (instance === undefined) {
    throw new Error('No modal instance')
  }

  forEach(args, (value: any, key: any) => (instance!.state[key] = value))
  instance.state.showModal = true

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

interface State extends PropsModal {
  showModal: boolean
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
      message: <p></p>,
      onReject: () => {},
      onSuccess: () => {},
      showModal: false,
      title: <p></p>,
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
        this.state.onReject('Normal reject')
        this.effects._closeModal()
      },
      _success: function () {
        this.state.onSuccess('Success')
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
          <button onClick={_success}>
            <FormattedMessage id='ok' />
          </button>
          <button onClick={_reject}>
            <FormattedMessage id='cancel' />
          </button>
        </footer>
      </div>
    ) : null
  }
)

export default Modal
