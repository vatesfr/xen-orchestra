import _ from 'messages'
import React, { Component } from 'react'
import { Modal as ReactModal } from 'react-bootstrap-4/lib'
import { propTypes } from 'utils'

@propTypes({
  title: propTypes.string,
  size: propTypes.oneOf(['lg', 'large', 'sm', 'small']),
  children: propTypes.node
})
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
    const { title, size, children } = this.props
    return (
      <ReactModal bsSize={size} show={this.state.showModal} onHide={() => this.close()}>
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
