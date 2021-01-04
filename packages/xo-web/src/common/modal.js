import PropTypes from 'prop-types'
import React, { Component, cloneElement } from 'react'
import { createSelector } from 'selectors'
import { identity, map } from 'lodash'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { Modal as ReactModal } from 'react-bootstrap-4/lib'

import _, { messages } from './intl'
import ActionButton from './action-button'
import Button from './button'
import decorate from './apply-decorators'
import getEventValue from './get-event-value'
import Icon from './icon'
import Tooltip from './tooltip'
import { generateId } from './reaclette-utils'
import { disable as disableShortcuts, enable as enableShortcuts } from './shortcuts'

// -----------------------------------------------------------------------------

let instance
const modal = (content, onClose, props) => {
  if (!instance) {
    throw new Error('No modal instance.')
  } else if (instance.state.showModal) {
    throw new Error('Other modal still open.')
  }
  instance.setState({ content, onClose, showModal: true, props }, disableShortcuts)
}

const _addRef = (component, ref) => {
  if (typeof component === 'string' || Array.isArray(component)) {
    return component
  }

  try {
    return cloneElement(component, { ref })
  } catch (_) {} // Stateless component.
  return component
}

// -----------------------------------------------------------------------------

class GenericModal extends Component {
  static propTypes = {
    buttons: PropTypes.arrayOf(
      PropTypes.shape({
        btnStyle: PropTypes.string,
        icon: PropTypes.string,
        label: PropTypes.node.isRequired,
        tooltip: PropTypes.node,
        value: PropTypes.any,
      })
    ).isRequired,
    children: PropTypes.node.isRequired,
    icon: PropTypes.string,
    title: PropTypes.node.isRequired,
  }

  _getBodyValue = () => {
    const { body } = this.refs
    if (body !== undefined) {
      return body.getWrappedInstance === undefined ? body.value : body.getWrappedInstance().value
    }
  }

  _resolve = (value = this._getBodyValue()) => {
    this.props.resolve(value)
    instance.close()
  }

  _reject = () => {
    this.props.reject()
    instance.close()
  }

  render() {
    const { buttons, icon, title } = this.props

    const body = _addRef(this.props.children, 'body')

    return (
      <div>
        <ReactModal.Header closeButton>
          <ReactModal.Title>
            {icon ? (
              <span>
                <Icon icon={icon} /> {title}
              </span>
            ) : (
              title
            )}
          </ReactModal.Title>
        </ReactModal.Header>
        <ReactModal.Body>{body}</ReactModal.Body>
        <ReactModal.Footer>
          {map(buttons, ({ label, tooltip, value, icon, ...props }, key) => {
            const button = (
              <Button onClick={() => this._resolve(value)} {...props}>
                {icon !== undefined && <Icon icon={icon} fixedWidth />}
                {label}
              </Button>
            )
            return (
              <span key={key}>{tooltip !== undefined ? <Tooltip content={tooltip}>{button}</Tooltip> : button} </span>
            )
          })}
          {this.props.reject !== undefined && <Button onClick={this._reject}>{_('genericCancel')}</Button>}
        </ReactModal.Footer>
      </div>
    )
  }
}

export const chooseAction = ({ body, buttons, icon, title }) => {
  return new Promise((resolve, reject) => {
    modal(
      <GenericModal buttons={buttons} icon={icon} reject={reject} resolve={resolve} title={title}>
        {body}
      </GenericModal>,
      reject
    )
  })
}

@injectIntl
class StrongConfirm extends Component {
  static propTypes = {
    body: PropTypes.node,
    strongConfirm: PropTypes.object.isRequired,
    icon: PropTypes.string,
    reject: PropTypes.func,
    resolve: PropTypes.func,
    title: PropTypes.node.isRequired,
  }

  state = {
    buttons: [{ btnStyle: 'danger', label: _('confirmOk'), disabled: true }],
  }

  _getStrongConfirmString = createSelector(
    () => this.props.intl.formatMessage,
    () => this.props.strongConfirm,
    (format, { messageId, values }) => format(messages[messageId], values)
  )

  _onInputChange = event => {
    const userInput = event.target.value
    const strongConfirmString = this._getStrongConfirmString()
    const confirmButton = this.state.buttons[0]

    let disabled
    if ((userInput.toLowerCase() === strongConfirmString.toLowerCase()) ^ (disabled = !confirmButton.disabled)) {
      this.setState({
        buttons: [{ ...confirmButton, disabled }],
      })
    }
  }

  _confirm = () => {
    this.props.resolve()
    instance.close()
  }

  _handleKeyDown = event => {
    if (event.keyCode === 13 && !this.state.buttons[0].disabled) {
      this._confirm()
    }
  }

  _focusAndAddEventListener = ref => {
    if (ref !== null) {
      // When the modal is triggered by a react-bootstrap Dropdown, the Dropdown takes the focus back
      // https://github.com/vatesfr/react-bootstrap/blob/bootstrap-4/src/Dropdown.js#L63-L85
      // FIXME: remove the setTimeout workaround when react-bootstrap-4 is removed
      // See https://github.com/react-bootstrap/react-bootstrap/issues/2553#issuecomment-324356126
      setTimeout(() => {
        ref.focus()
      })
      ref.addEventListener('keydown', this._handleKeyDown)
      this.componentWillUnmount = () => ref.removeEventListener('keydown', this._handleKeyDown)
    }
  }

  render() {
    const {
      body,
      strongConfirm: { messageId, values },
      icon,
      reject,
      resolve,
      title,
    } = this.props

    return (
      <GenericModal buttons={this.state.buttons} icon={icon} reject={reject} resolve={resolve} title={title}>
        {body}
        <hr />
        <div>
          {_('enterConfirmText')} <strong className='no-text-selection'>{_(messageId, values)}</strong>
        </div>
        <div>
          <input className='form-control' ref={this._focusAndAddEventListener} onChange={this._onInputChange} />
        </div>
      </GenericModal>
    )
  }
}

// -----------------------------------------------------------------------------

const ALERT_BUTTONS = [{ label: _('alertOk'), value: 'ok' }]

export const alert = (title, body) =>
  new Promise(resolve => {
    modal(
      <GenericModal buttons={ALERT_BUTTONS} resolve={resolve} title={title}>
        {body}
      </GenericModal>,
      resolve
    )
  })

// -----------------------------------------------------------------------------

const CONFIRM_BUTTONS = [{ btnStyle: 'primary', label: _('confirmOk') }]

export const confirm = ({ body, icon = 'alarm', title, strongConfirm }) =>
  strongConfirm
    ? new Promise((resolve, reject) => {
        modal(
          <StrongConfirm
            body={body}
            icon={icon}
            reject={reject}
            resolve={resolve}
            strongConfirm={strongConfirm}
            title={title}
          />,
          reject
        )
      })
    : chooseAction({
        body,
        buttons: CONFIRM_BUTTONS,
        icon,
        title,
      })

// -----------------------------------------------------------------------------

let formModalState
export const form = ({ component, defaultValue, handler = identity, header, render, size }) =>
  new Promise((resolve, reject) => {
    formModalState.component = component
    formModalState.handler = handler
    formModalState.header = header
    formModalState.reject = reject
    formModalState.render = render
    formModalState.resolve = resolve
    formModalState.size = size
    formModalState.value = defaultValue
    disableShortcuts()

    // the modal should be opened after its props have been set to avoid race conditions
    formModalState.opened = true
  })

const getInitialState = () => ({
  component: undefined,
  handler: undefined,
  header: undefined,
  isHandlerRunning: false,
  opened: false,
  reject: undefined,
  render: undefined,
  resolve: undefined,
  size: undefined,
  value: undefined,
})
export const FormModal = decorate([
  provideState({
    initialState: getInitialState,
    effects: {
      initialize() {
        if (formModalState !== undefined) {
          throw new Error('FormModal is a singleton!')
        }
        formModalState = this.state
      },
      finalize: () => {
        formModalState = undefined
      },
      onChange: (_, value) => () => ({
        value: getEventValue(value),
      }),
      onCancel() {
        const { state } = this
        if (!state.isHandlerRunning) {
          state.opened = false
          state.reject()
        }
      },
      async onSubmit({ close }) {
        const { state } = this
        state.isHandlerRunning = true

        let result
        try {
          result = await state.handler(state.value)
        } finally {
          state.isHandlerRunning = false
        }
        state.opened = false
        state.resolve(result)
      },
      reset: () => () => {
        enableShortcuts()
        return getInitialState()
      },
    },
    computed: {
      formId: generateId,
    },
  }),
  injectState,
  ({ state, effects }) => {
    const Component = state.component

    return (
      <ReactModal
        backdrop='static'
        bsSize={state.size}
        keyboard={false}
        onExited={effects.reset}
        onHide={effects.onCancel}
        show={state.opened}
      >
        <ReactModal.Header closeButton>
          <ReactModal.Title>{state.header}</ReactModal.Title>
        </ReactModal.Header>

        <ReactModal.Body>
          <form id={state.formId}>
            {/* It should be better to use a computed to avoid calling the render function on each render,
            but reaclette(v0.4.0) not allow us to access to the effects from a computed */}
            {Component !== undefined ? (
              <Component onChange={effects.onChange} value={state.value} />
            ) : (
              state.render !== undefined &&
              state.render({
                onChange: effects.onChange,
                value: state.value,
              })
            )}
          </form>
        </ReactModal.Body>

        <ReactModal.Footer>
          <ActionButton btnStyle='primary' form={state.formId} handler={effects.onSubmit} icon='save' size='large'>
            {_('formOk')}
          </ActionButton>{' '}
          <ActionButton handler={effects.onCancel} icon='cancel' size='large'>
            {_('formCancel')}
          </ActionButton>
        </ReactModal.Footer>
      </ReactModal>
    )
  },
])

// -----------------------------------------------------------------------------

export default class Modal extends Component {
  constructor() {
    super()

    this.state = { showModal: false }
  }

  componentDidMount() {
    if (instance) {
      throw new Error('Modal is a singleton!')
    }
    instance = this
  }

  componentWillUnmount() {
    instance = undefined
  }

  close() {
    this.setState({ showModal: false }, enableShortcuts)
  }

  _onHide = () => {
    this.close()

    const { onClose } = this.state
    onClose && onClose()
  }

  render() {
    const { content, showModal, props } = this.state
    return (
      <ReactModal show={showModal} onHide={this._onHide} {...props}>
        {content}
      </ReactModal>
    )
  }
}
