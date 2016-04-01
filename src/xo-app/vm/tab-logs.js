import _ from 'messages'
import Icon from 'icon'
import React from 'react'
import { Row, Col } from 'grid'

export default ({
  snapshots,
  vm
}) => <div>
  <Row>
    <Col smallSize={12}>
      <button className='btn btn-lg btn-danger btn-tab'>
        <Icon icon='delete' size={1} /> {_('logRemoveAll')}
      </button>
    </Col>
  </Row>
</div>
