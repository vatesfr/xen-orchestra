import _ from 'messages'
import React from 'react'
import { Container, Row, Col } from 'grid'

export default ({
  hosts
}) => <Container>
  <Row>
    <Col className='text-xs-right'>
      {_('comingSoon')}
    </Col>
  </Row>
</Container>
