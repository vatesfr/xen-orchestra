import _ from 'messages'
import { Button, Modal as ReactModal } from 'react-bootstrap-4/lib'
import React, { Component } from 'react'

let instance

const modal = (title, body, footer, onClose) => {
  if (!instance) {
    throw new Error('No modal instance.')
  } else if (instance.showModal) {
    throw new Error('Other modal still open.')
  }
  instance.setState({ title, body, footer, onClose, showModal: true })
}

export const alert = (title, body) => {
  return new Promise(resolve => {
    modal(
      title,
      body,
      <Button bsStyle='primary' onClick={() => {
        resolve()
        instance.close()
      }} style={{marginRight: '0.5em'}} key='ok'>{_('ok')}</Button>,
      resolve
    )
  })
}

export const confirm = (title, body) => {
  return new Promise((resolve, reject) => {
    modal(
      title,
      body,
      [
        <Button bsStyle='primary' onClick={() => {
          resolve()
          instance.close()
        }} style={{marginRight: '0.5em'}} key='ok'>{_('ok')}</Button>,
        <Button bsStyle='secondary' onClick={() => {
          reject()
          instance.close()
        }} key='cancel'>{_('cancel')}</Button>
      ],
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
    const { title, body, footer, showModal } = this.state
    /* TODO: remove this work-around and use
     * ReactModal.Body, ReactModal.Header, ...
     * after this issue has been fixed:
     * https://phabricator.babeljs.io/T6976
     */
    const { Body, Footer, Header, Title } = ReactModal
    return (
      <ReactModal show={showModal} onHide={this._onHide}>
        <Header closeButton>
          <Title>{title}</Title>
        </Header>
        <Body>
          {body}
        </Body>
        <Footer>
          {footer}
        </Footer>
      </ReactModal>
    )
  }
}

/* Example:

import { alert, confirm } from 'modal'

<button onClick={() => alert('My first modal', 'This is my first modal')}>
  My 1st modal
</button>

<button onClick={() => confirm('My second modal', <div>
  This is a more complex modal which:
  <ul>
    <li>uses JSX syntax</li>
    <li>can be confirmed or cancelled</li>
  </ul>
</div>
).then(() =>
  console.log('Confirmed')
).catch(() =>
  console.log('Cancelled'))}>
  My 2nd modal
</button>
*/
