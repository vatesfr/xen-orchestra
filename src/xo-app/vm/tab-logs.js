import _ from 'messages'
import React from 'react'
import { Row, Col } from 'grid'

export default ({
  snapshots,
  vm
}) => <div>
  <Row>
    <Col smallSize={12}>
      <button className='btn btn-lg btn-danger btn-tab pull-xs-right'>{_('logRemoveAll')}</button>
    </Col>
  </Row>
</div>
