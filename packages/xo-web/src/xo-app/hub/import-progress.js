import Component from 'base-component'
import React from 'react'
import { Col, Row } from 'grid'

export default class ImportProgress extends Component {
  render() {
    return (
      <Row>
        <Col size={12}>
          <progress className='progress' />
        </Col>
      </Row>
    )
  }
}
