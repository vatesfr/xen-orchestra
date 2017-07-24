import isArray from 'lodash/isArray'
import isString from 'lodash/isString'
import map from 'lodash/map'
import React, { Component, cloneElement } from 'react'
import { Modal as ReactModal } from 'react-bootstrap-4/lib'

import _ from './intl'
import Button from './button'
import Icon from './icon'
import propTypes from './prop-types-decorator'
import Tooltip from './tooltip'
import {
  disable as disableShortcuts,
  enable as enableShortcuts
} from './shortcuts'

let instance

const modal = (content, onClose) => {
  if (!instance) {
    throw new Error('No modal instance.')
  } else if (instance.state.showModal) {
    throw new Error('Other modal still open.')
  }
  instance.setState({ content, onClose, showModal: true }, disableShortcuts)
}

@propTypes({
  buttons: propTypes.arrayOf(propTypes.shape({
    btnStyle: propTypes.string,
    icon: propTypes.string,
    label: propTypes.node.isRequired,
    tooltip: propTypes.node,
    value: propTypes.any
  })).isRequired,
  children: propTypes.node.isRequired,
  icon: propTypes.string,
  title: propTypes.node.isRequired
})
class GenericModal extends Component {
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
    const {
      buttons,
      icon,
      title
    } = this.props

    const body = _addRef(this.props.children, 'body')

    return <div>
      <ReactModal.Header closeButton>
        <ReactModal.Title>
          {icon
            ? <span><Icon icon={icon} /> {title}</span>
            : title
          }
        </ReactModal.Title>
      </ReactModal.Header>
      <ReactModal.Body>
        {body}
      </ReactModal.Body>
      <ReactModal.Footer>
        {map(buttons, ({
          label,
          tooltip,
          value,
          icon,
          ...props
        }, key) => {
          const button = <Button
            onClick={() => this._resolve(value)}
            {...props}
          >
            {icon !== undefined && <Icon icon={icon} fixedWidth />}
            {label}
          </Button>
          return <span key={key}>
            {tooltip !== undefined
              ? <Tooltip content={tooltip}>{button}</Tooltip>
              : button
            }
            {' '}
          </span>
        })}
        {this.props.reject !== undefined &&
          <Button onClick={this._reject} >
            {_('genericCancel')}
          </Button>
        }
      </ReactModal.Footer>
    </div>
  }
}

const ALERT_BUTTONS = [ { label: _('alertOk'), value: 'ok' } ]

export const alert = (title, body) => (
  new Promise(resolve => {
    modal(
      <GenericModal
        buttons={ALERT_BUTTONS}
        resolve={resolve}
        title={title}
      >
        {body}
      </GenericModal>,
      resolve
    )
  })
)

const _addRef = (component, ref) => {
  if (isString(component) || isArray(component)) {
    return component
  }

  try {
    return cloneElement(component, { ref })
  } catch (_) {} // Stateless component.
  return component
}

const CONFIRM_BUTTONS = [ { btnStyle: 'primary', label: _('confirmOk') } ]

export const confirm = ({
  body,
  icon = 'alarm',
  title
}) => (
  chooseAction({
    body,
    buttons: CONFIRM_BUTTONS,
    icon,
    title
  })
)

export const chooseAction = ({
  body,
  buttons,
  icon,
  title
}) => {
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
    return (
      <ReactModal show={this.state.showModal} onHide={this._onHide}>
        {this.state.content}
      </ReactModal>
    )
  }
}
