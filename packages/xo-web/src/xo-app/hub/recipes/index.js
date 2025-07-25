import decorate from 'apply-decorators'
import React from 'react'
import { adminOnly } from 'utils'
import { Container, Col, Row } from 'grid'

import RecipeKub from './recipe-kub'
import RecipeEasyVirt from './recipe-ev'

// ==================================================================

export default decorate([
  adminOnly,
  () => (
    <Container>
      <Row>
        <Col mediumSize={4}>
          <RecipeKub />
        </Col>
        <Col mediumSize={4}>
          <RecipeEasyVirt />
        </Col>
      </Row>
    </Container>
  ),
])
