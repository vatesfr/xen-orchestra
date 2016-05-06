import _ from 'messages'
import React, { Component } from 'react'
import { Modal as ReactModal } from 'react-bootstrap-4/lib'

export default class Modal extends Component {
  componentWillMount () {
    this.setState({ showModal: false })
  }

  close () {
    this.setState({ showModal: false })
  }

  open () {
    this.setState({ showModal: true })
  }

  render () {
    const { title, children } = this.props
    return (
      <ReactModal show={this.state.showModal} onHide={() => this.close()}>
        {title &&
          <ReactModal.Header closeButton>
            <ReactModal.Title>{_(title)}</ReactModal.Title>
          </ReactModal.Header>
        }
        <ReactModal.Body>
          {children}
        </ReactModal.Body>
      </ReactModal>
    )
  }
}
