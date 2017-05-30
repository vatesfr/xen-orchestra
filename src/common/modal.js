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
    name: propTypes.string.isRequired,
    tooltip: propTypes.node,
    value: propTypes.string
  })).isRequired,
  children: propTypes.node.isRequired,
  icon: propTypes.string,
  title: propTypes.node.isRequired
})
class GenericModal extends Component {
  _resolve = value => {
    if (value !== undefined) {
      this.props.resolve(value)
      instance.close()

      return
    }

    const { body } = this.refs

    this.props.resolve(body && (body.getWrappedInstance
      ? body.getWrappedInstance().value
      : body.value
    ))
    instance.close()
  }

  _reject = () => {
    this.props.reject()
    instance.close()
  }

  render () {
    const { Body, Footer, Header, Title } = ReactModal
<<<<<<< 7a3f932313c075383ccae46b9ab860a5877800c9
    const { title, icon, okLabel = _('confirmOk'), cancelLabel = _('confirmCancel') } = this.props
=======

    const {
      buttons,
      icon,
      title
    } = this.props
>>>>>>> fix errors

    const body = _addRef(this.props.children, 'body')

    return <div>
      <Header closeButton>
        <Title>
          {icon
            ? <span><Icon icon={icon} /> {title}</span>
            : title
          }
        </Title>
      </Header>
      <Body>
        {body}
      </Body>
      <Footer>
<<<<<<< 7a3f932313c075383ccae46b9ab860a5877800c9
        <Button
          btnStyle='primary'
          onClick={this._resolve}
          style={this._style}
        >
          {okLabel}
        </Button>
        {' '}
        <Button
          onClick={this._reject}
        >
          {cancelLabel}
        </Button>
=======
        {map(buttons, ({
          label,
          tooltip,
          value,
          icon,
          ...props
        }) => {
          const button = <Button
            onClick={() => this._resolve(value)}
            key={value}
            {...props}
          >
            {icon !== undefined && <Icon icon={icon} fixedWidth />}
            {label}
          </Button>
          return <span>
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
>>>>>>> fix errors
      </Footer>
    </div>
  }
}

<<<<<<< db4ec7e520405f9637c3bd408b9717e3ea9c573c
<<<<<<< 7a3f932313c075383ccae46b9ab860a5877800c9
export const confirm = ({
  body,
  title,
  okLabel,
  cancelLabel,
  icon = 'alarm'
}) => {
  return new Promise((resolve, reject) => {
=======
export const alert = (title, body) => {
  const buttons = [{ name: _('alertOk'), value: 'ok' }]

  return new Promise(resolve => {
>>>>>>> fix errors
=======
const ALERT_BUTTONS = [ { label: _('alertOk'), value: 'ok' } ]

export const alert = (title, body) => (
  new Promise(resolve => {
>>>>>>> fix errors
    modal(
      <GenericModal
        buttons={ALERT_BUTTONS}
        resolve={resolve}
<<<<<<< 7a3f932313c075383ccae46b9ab860a5877800c9
        reject={reject}
        icon={icon}
        okLabel={okLabel}
        cancelLabel={cancelLabel}
=======
        title={title}
>>>>>>> fix errors
      >
        {body}
      </GenericModal>
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
  new Promise((resolve, reject) => {
    modal(
      <GenericModal
        buttons={CONFIRM_BUTTONS}
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
)

export const chooseAction = ({
  body,
  icon,
  buttons,
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
    const { showModal } = this.state
    /* TODO: remove this work-around and use
     * ReactModal.Body, ReactModal.Header, ...
     * after this issue has been fixed:
     * https://phabricator.babeljs.io/T6976
     */
    return (
      <ReactModal show={showModal} onHide={this._onHide}>
        {this.state.content}
      </ReactModal>
    )
  }
}
