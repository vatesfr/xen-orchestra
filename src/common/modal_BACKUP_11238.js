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
    disabled: propTypes.bool,
    icon: propTypes.node,
    name: propTypes.string.isRequired,
    tooltip: propTypes.node,
    value: propTypes.string
  })),
  children: propTypes.node.isRequired,
  icon: propTypes.string,
  title: propTypes.node.isRequired
})
class GenericModal extends Component {
  _resolve = value => {
    if (value !== undefined) {
      this.props.resolve(value)
      instance.close()
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

    const button = ({
      icon,
      name,
      props,
      value
    }) =>
      <Button
        onClick={() => this._resolve(value)}
        {...props}
      >
        {icon !== undefined && <Icon icon={icon} fixedWidth />}
        {name}
      </Button>

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
          name,
          tooltip,
          value,
          icon,
          ...props
        }) =>
          <span>
            {tooltip !== undefined
              ? <Tooltip content={tooltip}>
                {button({name, value, icon, props})}
              </Tooltip>
              : button({name, value, icon, props})
            }
            {' '}
          </span>
        )}
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
    modal(
      <GenericModal
        buttons={buttons}
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

export const confirm = ({
  body,
  icon = 'alarm',
  title
}) => {
  const buttons = [ { btnStyle: 'primary', name: _('confirmOk') } ]

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
