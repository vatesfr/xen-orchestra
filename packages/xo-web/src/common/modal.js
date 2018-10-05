import isArray from 'lodash/isArray'
import isString from 'lodash/isString'
import map from 'lodash/map'
import PropTypes from 'prop-types'
import React, { Component, cloneElement } from 'react'
import { createSelector } from 'selectors'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from '@julien-f/freactal'
import { Modal as ReactModal } from 'react-bootstrap-4/lib'

import _, { messages } from './intl'
import ActionButton from './action-button'
import Button from './button'
import Icon from './icon'
import Tooltip from './tooltip'
import { generateRandomId } from './utils'
import {
  disable as disableShortcuts,
  enable as enableShortcuts,
} from './shortcuts'

// -----------------------------------------------------------------------------

let instance
const modal = (content, onClose, props) => {
  if (!instance) {
    throw new Error('No modal instance.')
  } else if (instance.state.showModal) {
    throw new Error('Other modal still open.')
  }
  instance.setState(
    { content, onClose, showModal: true, props },
    disableShortcuts
  )
}

const _addRef = (component, ref) => {
  if (isString(component) || isArray(component)) {
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
      return body.getWrappedInstance === undefined
        ? body.value
        : body.getWrappedInstance().value
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

  render () {
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
              <span key={key}>
                {tooltip !== undefined ? (
                  <Tooltip content={tooltip}>{button}</Tooltip>
                ) : (
                  button
                )}{' '}
              </span>
            )
          })}
          {this.props.reject !== undefined && (
            <Button onClick={this._reject}>{_('genericCancel')}</Button>
          )}
        </ReactModal.Footer>
      </div>
    )
  }
}

export const chooseAction = ({ body, buttons, icon, title }) => {
  return new Promise((resolve, reject) => {
    modal(
      <GenericModal
        buttons={buttons}
        icon={icon}
        reject={reject}
        resolve={resolve}
        title={title}
      >
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
    if (
      (userInput.toLowerCase() === strongConfirmString.toLowerCase()) ^
      (disabled = !confirmButton.disabled)
    ) {
      this.setState({
        buttons: [{ ...confirmButton, disabled }],
      })
    }
  }

  render () {
    const {
      body,
      strongConfirm: { messageId, values },
      icon,
      reject,
      resolve,
      title,
    } = this.props

    return (
      <GenericModal
        buttons={this.state.buttons}
        icon={icon}
        reject={reject}
        resolve={resolve}
        title={title}
      >
        {body}
        <hr />
        <div>
          {_('enterConfirmText')}{' '}
          <strong className='no-text-selection'>{_(messageId, values)}</strong>
        </div>
        <div>
          <input
            className='form-control'
            ref={ref => {
              ref && ref.focus()
            }}
            onChange={this._onInputChange}
          />
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
export const form = props =>
  new Promise((resolve, reject) => {
    formModalState.props = {
      reject,
      resolve,
      showModal: true,
      ...props,
    }
    disableShortcuts()
  })

const getInitialState = () => ({
  id: generateRandomId(),
  localValue: undefined,
  props: undefined,
})
export const FormModal = [
  provideState({
    initialState: getInitialState,
    effects: {
      initialize: function () {
        formModalState = this.state
      },
      finalize: () => {
        formModalState = undefined
      },
      close: () => () => {
        enableShortcuts()
        return getInitialState()
      },
      cancel: function ({ close }) {
        this.state.props.reject()
        close()
      },
      submit: function ({ close }) {
        const {
          props: { resolve },
          value,
        } = this.state
        resolve(value)
        close()
      },
      onChange: (_, localValue) => () => ({
        localValue,
      }),
    },
    computed: {
      value: ({ props = {}, localValue = props.defaultValue }) => localValue,
    },
  }),
  injectState,
  ({ state: { id, props = {}, value }, effects }) => (
    <ReactModal
      bsSize={props.size}
      onHide={effects.cancel}
      show={props.showModal}
    >
      <ReactModal.Header closeButton>
        <ReactModal.Title>
          {props.icon !== undefined ? (
            <span>
              <Icon icon={props.icon} /> {props.title}
            </span>
          ) : (
            props.title
          )}
        </ReactModal.Title>
      </ReactModal.Header>

      <ReactModal.Body>
        <form id={id}>
          {props.body !== undefined &&
            cloneElement(props.body, {
              value,
              onChange: effects.onChange,
            })}
        </form>
      </ReactModal.Body>

      <ReactModal.Footer>
        <ActionButton
          btnStyle='primary'
          form={id}
          handler={effects.submit}
          icon='save'
          size='large'
        >
          {_('formOk')}
        </ActionButton>{' '}
        <ActionButton handler={effects.cancel} icon='cancel' size='large'>
          {_('formCancel')}
        </ActionButton>
      </ReactModal.Footer>
    </ReactModal>
  ),
].reduceRight((value, decorator) => decorator(value))

// -----------------------------------------------------------------------------

export default class Modal extends Component {
  constructor () {
    super()

    this.state = { showModal: false }
  }

  componentDidMount () {
    if (instance) {
      throw new Error('Modal is a singleton!')
    }
    instance = this
  }

  componentWillUnmount () {
    instance = undefined
  }

  close () {
    this.setState({ showModal: false }, enableShortcuts)
  }

  _onHide = () => {
    this.close()

    const { onClose } = this.state
    onClose && onClose()
  }

  render () {
    const { content, showModal, props } = this.state
    return (
      <ReactModal show={showModal} onHide={this._onHide} {...props}>
        {content}
      </ReactModal>
    )
  }
}
