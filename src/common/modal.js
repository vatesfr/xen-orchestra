import React from 'react'
import { isArray } from 'lodash'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'

import _ from './intl'
import ActionButton from './action-button'
import Icon from './icon'
import {
  disable as disableShortcuts,
  enable as enableShortcuts,
} from './shortcuts'

const addRef = (component, ref) => {
  if (typeof component === 'string' || isArray(component)) {
    return component
  }

  try {
    return React.cloneElement(component, { ref })
  } catch (_) {} // Stateless component.
  return component
}

let instance
export default class XoModal extends React.Component {
  state = {
    body: undefined,
    buttons: undefined,
    icon: undefined,
    isOpen: false,
    title: undefined,
  }

  componentDidMount () {
    if (instance !== undefined) {
      throw new Error('only one instance of Modal can be mounted')
    }
    instance = this
  }

  componentDidUpdate (_, { isOpen: wasOpen }) {
    if (this.state.isOpen) {
      if (!wasOpen) {
        disableShortcuts()
      }
    } else if (wasOpen) {
      enableShortcuts()
    }
  }

  componentWillUnmount () {
    instance = undefined
  }

  close () {
    this.setState({
      body: undefined,
      buttons: undefined,
      icon: undefined,
      isOpen: false,
      title: undefined,
    })
  }
  close = this.close.bind(this)

  onButtonClick (button) {
    let bodyValue
    const { body } = this.refs
    if (body !== undefined) {
      bodyValue =
        body.getWrappedInstance === undefined
          ? body.value
          : body.getWrappedInstance().value
    }
    return new Promise(resolve =>
      resolve(button.handler(button.handlerParam, bodyValue))
    ).then(this.close)
  }
  onButtonClick = this.onButtonClick.bind(this)

  open ({ body, buttons, icon, title }) {
    if (this.state.isOpen) {
      throw new Error('Modal is already open')
    }

    this.setState({ body, buttons, icon, isOpen: true, title })
  }

  toggle = () => this.setState(state => ({ isOpen: state.isOpen }))

  render () {
    const { close, onButtonClick, state } = this

    const { buttons, icon, title } = state
    const body = addRef(state.body)

    return (
      <Modal isOpen={state.isOpen} toggle={close}>
        <ModalHeader toggle={close}>
          {icon !== undefined ? (
            <span>
              <Icon icon={icon} /> {title}
            </span>
          ) : (
            title
          )}
        </ModalHeader>
        <ModalBody>{body}</ModalBody>
        <ModalFooter>
          {buttons !== undefined &&
            buttons.map((button, key) => (
              <ActionButton
                icon='success'
                {...button}
                handler={onButtonClick}
                handlerParam={button}
                key={key}
              />
            ))}
        </ModalFooter>
      </Modal>
    )
  }
}

// -------------------------------------------------------------------

export const alert = (title, body) =>
  new Promise(resolve => {
    instance.open({
      body,
      buttons: [
        {
          children: _('alertOk'),
          handler: resolve,
        },
      ],
      title,
    })
  })

export const chooseAction = ({ body, buttons, icon, title }) =>
  new Promise((resolve, reject) => {
    instance.open({
      body,
      buttons: [
        ...buttons.map(({ label, value, ...button }) => ({
          ...button,
          children: label,
          handler: resolve,
          handlerParam: value,
        })),
        {
          children: _('genericCancel'),
          handler: reject,
        },
      ],
      icon,
      title,
    })
  })

export const confirm = ({ body, icon = 'alarm', title }) =>
  new Promise((resolve, reject) => {
    instance.open({
      body,
      buttons: [
        {
          btnStyle: 'primary',
          children: _('confirmOk'),
          handler: resolve,
        },
        {
          children: _('genericCancel'),
          handler: reject,
        },
      ],
    })
  })
