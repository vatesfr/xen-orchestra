import _ from 'messages'
import Icon from 'icon'
import React, { Component, cloneElement } from 'react'
import { Button, Modal as ReactModal } from 'react-bootstrap-4/lib'

let instance

const modal = (content, onClose) => {
  if (!instance) {
    throw new Error('No modal instance.')
  } else if (instance.state.showModal) {
    throw new Error('Other modal still open.')
  }
  instance.setState({ content, onClose, showModal: true })
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
          }} style={{marginRight: '0.5em'}} key='ok'>{_('ok')}</Button>
        </Footer>
      </div>,
      resolve
    )
  })
}

class Confirm extends Component {
  _resolve = () => {
    this.props.resolve(this.refs.body.value)
    instance.close()
  }
  _reject = () => {
    this.props.reject()
    instance.close()
  }

  _style = { marginRight: '0.5em' }

  render () {
    const { Body, Footer, Header, Title } = ReactModal
    const { title, body, icon } = this.props
    return <div>
      <Header closeButton>
        <Title>
        {icon
          ? <span><Icon icon={icon} /> {title}</span>
          : title}
        </Title>
      </Header>
      <Body>
        {cloneElement(body, { ref: 'body' })}
      </Body>
      <Footer>
        <Button
          bsStyle='primary'
          onClick={this._resolve}
          style={this._style}
          key='ok'
        >
          {_('ok')}
        </Button>
        <Button
          bsStyle='secondary'
          onClick={this._reject}
          key='cancel'
        >
          {_('cancel')}
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
        body={body}
        resolve={resolve}
        reject={reject}
        icon={icon}
      />,
      reject
    )
  })
}

export default class Modal extends Component {
  constructor () {
    super()

    if (instance) {
      throw new Error('Modal is a singleton!')
    }
    instance = this
  }

  componentWillMount () {
    this.setState({ showModal: false })
  }

  close () {
    this.setState({ showModal: false })
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
