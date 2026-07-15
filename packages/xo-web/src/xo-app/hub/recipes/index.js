import decorate from 'apply-decorators'
import React from 'react'
import { adminOnly } from 'utils'
import { Container, Col, Row } from 'grid'

import RECIPES from './recipes'

// ==================================================================

export default decorate([
  adminOnly,
  () => (
    <Container>
      <Row>
        {RECIPES.filter(({ isAvailable }) => isAvailable()).map(({ id, component: Recipe }) => (
          <Col key={id} mediumSize={4}>
            <Recipe />
          </Col>
        ))}
      </Row>
    </Container>
  ),
])
