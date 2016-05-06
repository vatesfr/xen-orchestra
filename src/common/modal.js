import React, { Component } from 'react'
import { Modal as ReactModal } from 'react-bootstrap-4/lib'

let instance

const modal = (title, body, size) => {
  if (instance) {
    instance.setState({ title, body, size, showModal: true })
  }
}
export { modal as default }

export class Modal extends Component {
  constructor () {
    super()
    instance = this
  }

  componentWillMount () {
    this.setState({ showModal: false })
  }

  close () {
    this.setState({ showModal: false })
  }

  render () {
    const { title, body, size, showModal } = this.state
    return (
      <ReactModal bsSize={size} show={showModal} onHide={() => this.close()}>
        {title &&
          <ReactModal.Header closeButton>
            <ReactModal.Title>{title}</ReactModal.Title>
          </ReactModal.Header>
        }
        <ReactModal.Body>
          {body}
        </ReactModal.Body>
      </ReactModal>
    )
  }
}

/* Example:

import modal from 'modal'

<button onClick={() => modal('My first modal', 'This is my first modal')}>
  My 1st modal
</button>

<button onClick={() => modal('My second modal', <div>
  This is more complex modal which uses:
  <ul>
    <li>JSX syntax</li>
    <li>a size attribute</li>
  </ul>
</div>,
'large')}>
  My 2nd modal
</button>
*/
