import React, { Component } from 'react'
import { Row, Col } from 'grid'

export default class Navbar extends Component {
  render () {
    return <Row className='xo-navbar'>
      <Col smallSize={2}>
        <h1 style={{marginLeft: '5px'}}>Xen-Orchestra</h1>
      </Col>
    </Row>
  }
}
