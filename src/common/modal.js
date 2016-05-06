import _ from 'messages'
import { Button, Modal as ReactModal } from 'react-bootstrap-4/lib'
import React, { Component } from 'react'

let instance

const modal = (title, body, callback, type = 'alert') => {
  if (!instance) {
    throw new Error('No modal instance.')
  } else if (instance.showModal) {
    throw new Error('Other modal still open.')
  }
  instance.setState({ title, body, callback, type, showModal: true })
}

export const alert = (title, body, callback) => {
  modal(title, body, callback, 'alert')
}

export const confirm = (title, body, callback) => {
  modal(title, body, callback, 'confirm')
}

export class Modal extends Component {
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

  render () {
    const { title, body, callback, type, showModal } = this.state
    return (
      <ReactModal show={showModal} onHide={() => this.close()}>
        <ReactModal.Header closeButton>
          <ReactModal.Title>{title}</ReactModal.Title>
        </ReactModal.Header>
        <ReactModal.Body>
          {body}
        </ReactModal.Body>
        <ReactModal.Footer>
          {(type === 'alert') &&
            <Button onClick={() => {
              callback()
              this.close()
            }} bsStyle='primary'>
              {_('ok')}
            </Button>
          }
          {(type === 'confirm') && [
            <Button onClick={() => {
              callback()
              this.close()
            }} style={{marginRight: '0.5em'}} bsStyle='primary' key='ok'>
              {_('ok')}
            </Button>,
            <Button bsStyle='secondary' onClick={() => this.close()} key='cancel'>
              {_('cancel')}
            </Button>
          ]}
        </ReactModal.Footer>
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
  This is a more complex modal which uses:
  <ul>
    <li>a callback function</li>
    <li>JSX syntax</li>
  </ul>
</div>,
() => console.log('It works'))}>
  My 2nd modal
</button>
*/
