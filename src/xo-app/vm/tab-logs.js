import _ from 'messages'
import Icon from 'icon'
import React from 'react'
import { Debug } from 'utils'
import { Row, Col } from 'grid'

export default ({
  logs,
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
  <Row>
    <Col>
      <Debug value={logs} />
    </Col>
  </Row>
</div>
