import decorate from 'apply-decorators'
import React from 'react'
import { addSubscriptions, adminOnly } from 'utils'
import { Container, Col, Row } from 'grid'
import { injectState, provideState } from 'reaclette'
import { map, omit, orderBy } from 'lodash'
import { subscribeHubResourceCatalog } from 'xo'

import Recipe from './recipe'

// ==================================================================

export default decorate([
  adminOnly,
  addSubscriptions({
    catalog: subscribeHubResourceCatalog,
  }),
  provideState({
    computed: {
      resources: (_, { catalog }) =>
        orderBy(
          map(omit(catalog, '_namespaces'), (entry, namespace) => ({
            namespace,
            ...entry.xva,
          })),
          'name',
          'asc'
        ),
    },
  }),
  injectState,
  ({ state: { resources } }) => (
    <Container>
      <Row>
        <Col mediumSize={4}>
          <Recipe />
        </Col>
      </Row>
    </Container>
  ),
])
