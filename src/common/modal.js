import _ from 'intl'
import Icon from 'icon'
import isArray from 'lodash/isArray'
import isString from 'lodash/isString'
import React, { Component, cloneElement } from 'react'
import { Button, Modal as ReactModal } from 'react-bootstrap-4/lib'

import propTypes from './prop-types'
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

export const alert = (title, body) => {
  return new Promise(resolve => {
    const { Body, Footer, Header, Title } = ReactModal
    modal(
      <div>
        <Header closeButton>
          <Title>{title}</Title>
        </Header>
        <Body>{body}</Body>
        <Footer>
          <Button bsStyle='primary' onClick={() => {
            resolve()
            instance.close()
          }}>
            {_('alertOk')}
          </Button>
        </Footer>
      </div>,
      resolve
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

@propTypes({
  children: propTypes.node.isRequired,
  title: propTypes.node.isRequired,
  icon: propTypes.string
})
class Confirm extends Component {
  _resolve = () => {
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

  _style = { marginRight: '0.5em' }

  render () {
    const { Body, Footer, Header, Title } = ReactModal
    const { title, icon } = this.props

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
        <Button
          bsStyle='primary'
          onClick={this._resolve}
          style={this._style}
        >
          {_('confirmOk')}
        </Button>
        <Button
          bsStyle='secondary'
          onClick={this._reject}
        >
          {_('confirmCancel')}
        </Button>
      </Footer>
    </div>
  }
}

export const confirm = ({
  body,
  title,
  icon = 'alarm'
}) => {
  return new Promise((resolve, reject) => {
    modal(
      <Confirm
        title={title}
        resolve={resolve}
        reject={reject}
        icon={icon}
      >
        {body}
      </Confirm>,
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
