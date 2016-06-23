import _ from 'intl'
import React from 'react'
import { Container, Row, Col } from 'grid'

export default () => <Container>
  <Row>
    <Col>
      <h3>{_('comingSoon')}</h3>
    </Col>
  </Row>
</Container>
