import _ from 'intl'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { addSubscriptions, adminOnly } from 'utils'
import { Container, Col, Row } from 'grid'
import { injectState, provideState } from 'reaclette'
import { isEmpty, map, omit, orderBy } from 'lodash'
import { subscribeHubResourceCatalog } from 'xo'

import Resource from './resource'

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
        {isEmpty(resources) ? (
          <Col>
            <h2 className='text-muted'>
              &nbsp; {_('vmNoAvailable')}
              <Icon icon='alarm' color='yellow' />
            </h2>
          </Col>
        ) : (
          resources.map(data => (
            <Col key={data.namespace} mediumSize={6} largeSize={4}>
              <Resource {...data} />
            </Col>
          ))
        )}
      </Row>
    </Container>
  ),
])
