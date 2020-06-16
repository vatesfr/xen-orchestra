import decorate from 'apply-decorators'
import React from 'react'
import { adminOnly } from 'utils'
import { Container, Col, Row } from 'grid'

import Recipe from './recipe'

// ==================================================================

export default decorate([
  adminOnly,
  () => (
    <Container>
      <Row>
        <Col mediumSize={4}>
          <Recipe />
        </Col>
      </Row>
    </Container>
  ),
])
